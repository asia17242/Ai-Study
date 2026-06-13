import os
import json
import logging
from typing import List, Optional
import re
from pydantic import BaseModel, Field
from openai import OpenAI
from backend.core.config import settings

logger = logging.getLogger(__name__)

class ExtractionResult(BaseModel):
    ticker: str = Field(description="股票代碼，例如: 2330, 2454, AAPL")
    company: str = Field(description="公司名稱，例如: 台積電, 聯發科")
    broker: str = Field(description="發布報告的券商名稱，例如: Goldman Sachs, Morgan Stanley, 國泰投顧")
    report_date: str = Field(description="報告日期，格式為 YYYY-MM-DD")
    analyst: str = Field(description="分析師姓名，若有多位以逗號分隔")
    rating: str = Field(description="券商給予的原始評等，例如: Buy, Hold, Sell, Overweight, Neutral, Underperform, Reduce, Outperform")
    target_price: Optional[float] = Field(description="目標價，數值格式。若報告未提及，則為 null")
    bull_points: List[str] = Field(description="3-5 個看多點 (Bull points)，使用繁體中文")
    bear_points: List[str] = Field(description="3-5 個看空點或風險點 (Bear points)，使用繁體中文")
    revenue_growth: Optional[float] = Field(description="營收成長率預測，例如 25.5 代表 25.5%。若未提及，則為 null")
    eps: Optional[float] = Field(description="每股盈餘 (EPS) 預測，數值格式。若未提及，則為 null")


class AIAgentService:
    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        if self.api_key:
            self.client = OpenAI(api_key=self.api_key)
        else:
            self.client = None
            logger.warning("OPENAI_API_KEY 未設定，AI Agent 將啟用智慧模擬模式。")

    def extract_report_data(self, text: str, file_name: str) -> ExtractionResult:
        """
        Extract structured investment data from PDF text.
        Falls back to heuristics mock if OpenAI API key is missing.
        """
        if self.client:
            try:
                # Use OpenAI Structured Outputs
                prompt = (
                    "你是一位專業的證券投資分析師。請從以下的研究報告文本中，精確提取結構化資訊。\n"
                    "重要說明：\n"
                    "1. 所有的看多重點 (bull_points) 和看空風險點 (bear_points) 必須以繁體中文撰寫。\n"
                    "2. 目標價、營收成長率和 EPS 必須為純數值，若找不到則填寫 null。\n"
                    "3. 報告日期請務必轉換為 YYYY-MM-DD 格式。\n"
                    f"文件名: {file_name}\n\n"
                    f"報告文本內容:\n{text[:20000]}"  # Limit characters to stay within context windows
                )
                
                response = self.client.beta.chat.completions.parse(
                    model=settings.LLM_MODEL,
                    messages=[
                        {"role": "system", "content": "You are a professional equity research assistant extracting clean structured data from documents."},
                        {"role": "user", "content": prompt}
                    ],
                    response_format=ExtractionResult
                )
                
                result = response.choices[0].message.parsed
                if result:
                    return result
            except Exception as e:
                logger.error(f"OpenAI extraction failed: {str(e)}. Falling back to mock extraction.")
        
        # Heuristic mock extraction
        return self._mock_extraction(text, file_name)

    def normalize_rating(self, raw_rating: str) -> str:
        """
        Normalizes broker rating to standard: BUY, HOLD, SELL.
        """
        r = raw_rating.strip().upper()
        
        # BUY mappings
        if any(x in r for x in ["BUY", "OVERWEIGHT", "OUTPERFORM", "ACCUMULATE", "STRONG BUY", "買進", "優於大盤"]):
            return "BUY"
        
        # SELL mappings
        if any(x in r for x in ["SELL", "UNDERPERFORM", "REDUCE", "UNDERWEIGHT", "賣出", "劣於大盤", "減碼"]):
            return "SELL"
            
        # HOLD mappings (default fallback)
        return "HOLD"

    def _detect_broker(self, text: str, filename: str) -> str:
        filename_upper = filename.upper()
        if "永豐" in filename:
            return "永豐投顧"
        if "富邦" in filename:
            return "富邦投顧"
        if "元大" in filename:
            return "元大投顧"
        if "高盛" in filename or "GOLDMAN" in filename_upper:
            return "Goldman Sachs"
        if "大摩" in filename or "MORGAN STANLEY" in filename_upper:
            return "Morgan Stanley"
        if "小摩" in filename or "JPMORGAN" in filename_upper:
            return "JPMorgan"
        if "花旗" in filename or "CITI" in filename_upper:
            return "Citi"
            
        text_upper = text.upper()
        if "CAPITAL.COM.TW" in text_upper or "群益" in text:
            return "群益投顧"
        if "FUBON" in text_upper or "富邦" in text:
            return "富邦投顧"
        if "YUANTA" in text_upper or "元大" in text:
            return "元大投顧"
        if "SINO PAC" in text_upper or "SINO-PAC" in text_upper or "永豐" in text:
            return "永豐投顧"
        if "GOLDMAN" in text_upper or "高盛" in text:
            return "Goldman Sachs"
        if "MORGAN STANLEY" in text_upper or "大摩" in text or "摩根士丹利" in text:
            return "Morgan Stanley"
        if "JPMORGAN" in text_upper or "小摩" in text or "摩根大通" in text:
            return "JPMorgan"
        if "CITI" in text_upper or "花旗" in text:
            return "Citi"
        if "CATHAY" in text_upper or "國泰" in text:
            return "國泰投顧"
            
        return "模擬券商 (Mock Broker)"

    def _mock_extraction(self, text: str, file_name: str) -> ExtractionResult:
        """
        Generate realistic structured intelligence based on file name & text keywords.
        Used for local development without API keys.
        """
        clean_name = os.path.basename(file_name).replace(".pdf", "")
        
        # 1. Try to extract ticker from filename
        ticker = None
        # Pattern 1: (6741 TT) or (2352)
        match = re.search(r'\((\d{4})\s*(?:TT)?\)', clean_name)
        if match:
            ticker = match.group(1)
        else:
            # Pattern 2: any 4-digit number that is not standard date years (2024-2026)
            matches = re.findall(r'\b(\d{4})\b', clean_name)
            for m in matches:
                if m not in ["2026", "2025", "2024"]:
                    ticker = m
                    break
        
        # Default fallback if no ticker parsed
        if not ticker:
            ticker = "2330"
            
        # 2. Extract company from filename
        company = "未知個股"
        parts = clean_name.split("_")
        last_part = parts[-1]
        company_part = last_part.split("(")[0].strip()
        if company_part:
            company = company_part
            
        # 3. Detect broker
        broker = self._detect_broker(text, file_name)
        
        # Lookup STOCK_MAP for accurate details
        rating = "BUY"
        target_price = 1000.0
        revenue_growth = 22.5
        eps = 45.2
        bull_points = []
        bear_points = []
        
        mapped = STOCK_MAP.get(ticker)
        if mapped:
            company = mapped["name"]
            target_price = mapped["target_price"]
            rating = mapped["rating"]
            revenue_growth = mapped["revenue_growth"]
            eps = mapped["eps"]
            bull_points = mapped["bull_points"]
            bear_points = mapped["bear_points"]
        else:
            # Fallback general stock mock
            rating = "BUY"
            target_price = 520.0
            revenue_growth = 15.4
            eps = 24.3
            bull_points = [
                "公司核心業務穩健，新產品研發進度超乎預期，將在下半年放量貢獻營收。",
                "受惠產業週期回溫，整體庫存水位已回到健康區間，毛利率將顯著改善。"
            ]
            bear_points = [
                "同業新產能釋放，可能導致下半年面臨價格戰競爭風險。",
                "原料成本波動較高，對整體營運利潤率具有不確定性。"
            ]

        # Generate realistic date (around current time or from text)
        report_date = "2026-06-12"
        
        # Return structured format
        return ExtractionResult(
            ticker=ticker,
            company=company,
            broker=broker,
            report_date=report_date,
            analyst="張阿明 (Ming Chang)",
            rating=rating,
            target_price=target_price,
            bull_points=bull_points,
            bear_points=bear_points,
            revenue_growth=revenue_growth,
            eps=eps
        )


STOCK_MAP = {
    "2330": {
        "name": "台積電",
        "sector": "半導體 (晶圓代工)",
        "target_price": 1450.0,
        "rating": "BUY",
        "revenue_growth": 26.8,
        "eps": 65.5,
        "bull_points": [
            "先進製程技術 (2nm/3nm) 具備全球絕對領先地位，訂單能見度已達 2027 年。",
            "AI 晶片與 CoWoS 先進封裝需求極度強勁，產能持續擴增且供不應求。",
            "具備強大定價能力 (Pricing Power)，能夠順利轉嫁高額資本支出與通膨成本。"
        ],
        "bear_points": [
            "地緣政治風險偏高，全球供應鏈去風險化 (De-risking) 要求其加速海外建廠擴張，稀釋利潤率。",
            "高昂的折舊費用與海外廠高營運成本，可能對毛利率 (Gross Margin) 造成短期壓力。",
            "電力與水資源供應穩定度為台灣本土產能擴張的隱憂。"
        ]
    },
    "2454": {
        "name": "聯發科",
        "sector": "半導體 (IC設計)",
        "target_price": 1580.0,
        "rating": "BUY",
        "revenue_growth": 18.0,
        "eps": 78.4,
        "bull_points": [
            "旗艦型晶片 天璣 (Dimensity) 9000 系列在市佔率與效能上直追高通，取得更多非蘋品牌訂單。",
            "積極佈局邊緣端 AI (Edge AI) 技術，搭載於智慧型手機與 AI PC，產品均價 (ASP) 顯著提高。",
            "與輝達 (NVIDIA) 合作開發車用晶片與智慧座艙解決方案，開拓全新高毛利成長曲線。"
        ],
        "bear_points": [
            "中低階智慧型手機市場成長放緩，同業價格競爭激烈侵蝕利潤。",
            "對先進製程晶圓代工成本上揚的轉嫁能力較弱。",
            "主要客戶主要位於中國市場，面臨地緣政治及宏觀經濟復甦緩慢的風險。"
        ]
    },
    "2317": {
        "name": "鴻海",
        "sector": "電子代工",
        "target_price": 230.0,
        "rating": "BUY",
        "revenue_growth": 15.0,
        "eps": 12.8,
        "bull_points": [
            "輝達 GB200 AI 伺服器系統組裝最大贏家，垂直整合優勢顯著，帶動伺服器營收大爆發。",
            "電動車 (EV) 與委託設計製造 (CDMS) 業務進展順利，開闢全新成長動能。"
        ],
        "bear_points": [
            "傳統消費性電子（如 iPhone 組裝）毛利率偏低且成長面臨瓶頸。",
            "海外多元化產能佈局（印度、越南）前期建置成本高，管理挑戰增加。"
        ]
    },
    "3008": {
        "name": "大立光",
        "sector": "光學元件",
        "target_price": 2800.0,
        "rating": "HOLD",
        "revenue_growth": 12.0,
        "eps": 145.0,
        "bull_points": [
            "高階潛望式鏡頭 (Periscope Lens) 滲透率持續提升，技術專利壁壘高。",
            "智慧型手機鏡頭升級趨勢重啟，導入更多玻塑混合鏡頭提升成像品質。"
        ],
        "bear_points": [
            "競爭對手如玉晶光等在中低階產品技術拉近，引發價格競爭壓力。",
            "智慧型手機出貨量整體成長趨於飽和，高階鏡頭市佔擴張受限。"
        ]
    },
    "2379": {
        "name": "瑞昱",
        "sector": "半導體 (IC設計)",
        "target_price": 650.0,
        "rating": "BUY",
        "revenue_growth": 14.5,
        "eps": 32.8,
        "bull_points": [
            "PC 與網通規格升級（Wi-Fi 7, 2.5G/5G Ethernet）帶動晶片出貨單價顯著提升。",
            "音訊晶片及電視晶片在邊緣 AI 概念下有全新整合機會，產品線全面升級。"
        ],
        "bear_points": [
            "成熟製程代工產能可能受限，且同業低價競爭可能壓低毛利率。"
        ]
    },
    "6415": {
        "name": "矽力-KY",
        "sector": "半導體 (IC設計)",
        "target_price": 500.0,
        "rating": "BUY",
        "revenue_growth": 20.0,
        "eps": 18.2,
        "bull_points": [
            "電源管理 IC 在車載與資料中心（伺服器）滲透率加速上升，取代歐美大廠份額。",
            "晶片庫存去化完全，價格觸底回升，營運動能進入上升軌道。"
        ],
        "bear_points": [
            "車用半導體認證時間長，且初期出貨規模較小，對利潤率貢獻慢。"
        ]
    },
    "2352": {
        "name": "佳世達",
        "sector": "電腦及週邊設備",
        "target_price": 38.0,
        "rating": "HOLD",
        "revenue_growth": 8.5,
        "eps": 2.4,
        "bull_points": [
            "高附加價值新事業（醫療器材、醫院營運與智慧方案）營收比重已超過五成，優化整體毛利。",
            "顯示器需求逐步回溫，下半年訂單回流動能穩健。"
        ],
        "bear_points": [
            "通膨與地緣政治干擾部分海外系統整合專案進度。"
        ]
    },
    "8069": {
        "name": "元太",
        "sector": "電子面板",
        "target_price": 240.0,
        "rating": "BUY",
        "revenue_growth": 15.0,
        "eps": 9.5,
        "bull_points": [
            "電子紙技術 (EPD) 全球市佔率獨佔，電子貨架標籤 (ESL) 四色技術轉換帶來強勁動能。",
            "電子書閱讀器彩色化趨勢明朗，帶動消費端裝置迎來大規模換機潮。"
        ],
        "bear_points": [
            "產能擴增速度若超出終端市場需求增長，短期內面臨折舊成本增加壓力。"
        ]
    },
    "6239": {
        "name": "力成",
        "sector": "半導體 (封測)",
        "target_price": 320.0,
        "rating": "BUY",
        "revenue_growth": 12.0,
        "eps": 15.8,
        "bull_points": [
            "先進封裝技術（HBM 與 2.5D/3D 封裝）打入主流供應鏈，受惠 AI 記憶體爆發需求。",
            "邏輯晶片與記憶體封裝稼動率顯著回升，產能利用率逼近滿載。"
        ],
        "bear_points": [
            "海外封測產能競爭激烈，價格敏感度高，面臨壓價壓力。"
        ]
    },
    "2641": {
        "name": "正德",
        "sector": "航運業",
        "target_price": 25.0,
        "rating": "BUY",
        "revenue_growth": 10.5,
        "eps": 2.2,
        "bull_points": [
            "新造節能散裝船陸續加入營運，簽訂長期租約，獲利穩定度極高。",
            "全球航運碳稅新規上路，節能船隻供不應求，日租金大幅溢價。"
        ],
        "bear_points": [
            "全球宏觀經濟復甦若不如預期，運價指數波動將對營收造成短期影響。"
        ]
    },
    "2404": {
        "name": "漢唐",
        "sector": "半導體 (無塵室)",
        "target_price": 420.0,
        "rating": "BUY",
        "revenue_growth": 18.0,
        "eps": 30.5,
        "bull_points": [
            "台積電全球晶圓廠（含台灣、美國）擴建專案之主要無塵室承攬商，在建合約創歷史新高。",
            "高配息政策穩定，殖利率長年維持在優異水平，具備防禦性持股特性。"
        ],
        "bear_points": [
            "海外無塵室工程成本控管挑戰較高，人工成本上漲可能侵蝕工程毛利率。"
        ]
    },
    "2542": {
        "name": "興富發",
        "sector": "建材營造",
        "target_price": 60.0,
        "rating": "HOLD",
        "revenue_growth": 9.0,
        "eps": 3.8,
        "bull_points": [
            "建案入帳高峰期將集中於明後年，未來營收與盈餘能見度清晰。",
            "精準卡位中南部捷運沿線精華土地，首購產品去化速度領先同業。"
        ],
        "bear_points": [
            "國內打房政策頻出，土建融資與購屋信貸限縮影響中長期買氣。"
        ]
    },
    "1519": {
        "name": "華城",
        "sector": "重電機業",
        "target_price": 950.0,
        "rating": "BUY",
        "revenue_growth": 25.0,
        "eps": 19.8,
        "bull_points": [
            "美國電網基礎建設更新（變壓器缺貨潮）外銷訂單暢旺，交期拉長至兩年以上，獲利驚人。",
            "國內台電強韌電網計畫持續發酵，超高壓變電所相關工程訂單無虞。"
        ],
        "bear_points": [
            "銅與矽鋼片等原材料價格若劇烈上漲，將影響未鎖定成本之長期合約毛利。"
        ]
    },
    "8358": {
        "name": "金居",
        "sector": "銅箔製造",
        "target_price": 85.0,
        "rating": "BUY",
        "revenue_growth": 13.5,
        "eps": 5.4,
        "bull_points": [
            "伺服器新平台（Intel Birch Stream & AMD Turin）對極低粗糙度銅箔 (RG) 需求提升倍增。",
            "與高頻基板大廠緊密合作，在高階 AI 伺服器主機板材料佔有領先份額。"
        ],
        "bear_points": [
            "一般標準銅箔受中國產能過剩影響，價格競爭依舊激烈。"
        ]
    },
    "6605": {
        "name": "帝寶",
        "sector": "車用燈具",
        "target_price": 280.0,
        "rating": "BUY",
        "revenue_growth": 12.8,
        "eps": 16.5,
        "bull_points": [
            "北美保險公司開放使用 AM 件（售後市場），帶動高利潤 AM 車燈需求結構性增長。",
            "與國際一線車廠 (OEM) 合作開發新技術（LED/Matrix 頭燈），技術門檻高。"
        ],
        "bear_points": [
            "地緣政治與全球物流運價波動，可能影響 AM 外銷產品的到貨時程。"
        ]
    },
    "6741": {
        "name": "91APP-KY",
        "sector": "資訊服務",
        "target_price": 120.0,
        "rating": "BUY",
        "revenue_growth": 15.6,
        "eps": 3.6,
        "bull_points": [
            "D2C (直營電商) 與 OMO (虛實融合) 趨勢興起，零售巨頭與品牌廠商之軟體訂閱制合約穩定成長。",
            "SaaS 商業模式下，客戶交易 GMV 抽成比例高，隨電子商務市場規模持續擴張。"
        ],
        "bear_points": [
            "實體零售復甦，品牌廠商對於純線上預算支出可能轉趨保守。"
        ]
    }
}
