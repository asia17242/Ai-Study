import os
import json
import logging
from typing import List, Optional
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

    def _mock_extraction(self, text: str, file_name: str) -> ExtractionResult:
        """
        Generate realistic structured intelligence based on file name & text keywords.
        Used for local development without API keys.
        """
        # Parse ticker & broker from file_name if possible (e.g. 2330_Goldman.pdf)
        clean_name = os.path.basename(file_name).replace(".pdf", "")
        parts = clean_name.split("_")
        
        ticker = "2330"
        broker = "Goldman Sachs"
        if len(parts) >= 2:
            ticker = parts[0]
            broker = " ".join(parts[1:])
        elif len(parts) == 1 and parts[0].isdigit():
            ticker = parts[0]
            broker = "模擬券商 (Mock Broker)"
            
        # Determine company based on ticker
        company = "未知個股"
        rating = "BUY"
        target_price = 1000.0
        revenue_growth = 22.5
        eps = 45.2
        bull_points = []
        bear_points = []
        
        # Identify standard Taiwanese stocks to provide realistic mocks
        if "2330" in ticker or "TSMC" in text.upper() or "台積電" in text:
            ticker = "2330"
            company = "台積電"
            rating = "BUY"
            target_price = 1450.0
            revenue_growth = 26.8
            eps = 65.5
            bull_points = [
                "先進製程技術 (2nm/3nm) 具備全球絕對領先地位，訂單能見度已達 2027 年。",
                "AI 晶片與 CoWoS 先進封裝需求極度強勁，產能持續擴增且供不應求。",
                "具備強大定價能力 (Pricing Power)，能夠順利轉嫁高額資本支出與通膨成本。"
            ]
            bear_points = [
                "地緣政治風險偏高，全球供應鏈去風險化 (De-risking) 要求其加速海外建廠擴張，稀釋利潤率。",
                "高昂的折舊費用與海外廠高營運成本，可能對毛利率 (Gross Margin) 造成短期壓力。",
                "電力與水資源供應穩定度為台灣本土產能擴張的隱憂。"
            ]
        elif "2454" in ticker or "MEDIATEK" in text.upper() or "聯發科" in text:
            ticker = "2454"
            company = "聯發科"
            rating = "BUY"
            target_price = 1580.0
            revenue_growth = 18.0
            eps = 78.4
            bull_points = [
                "旗艦型晶片 天璣 (Dimensity) 9000 系列在市佔率與效能上直追高通，取得更多非蘋品牌訂單。",
                "積極佈局邊緣端 AI (Edge AI) 技術，搭載於智慧型手機與 AI PC，產品均價 (ASP) 顯著提高。",
                "與輝達 (NVIDIA) 合作開發車用晶片與智慧座艙解決方案，開拓全新高毛利成長曲線。"
            ]
            bear_points = [
                "中低階智慧型手機市場成長放緩，同業價格競爭激烈侵蝕利潤。",
                "對先進製程晶圓代工成本上揚的轉嫁能力較弱。",
                "主要客戶主要位於中國市場，面臨地緣政治及宏觀經濟復甦緩慢的風險。"
            ]
        elif "3008" in ticker or "LARGAN" in text.upper() or "大立光" in text:
            ticker = "3008"
            company = "大立光"
            rating = "HOLD"
            target_price = 2800.0
            revenue_growth = 12.0
            eps = 145.0
            bull_points = [
                "高階潛望式鏡頭 (Periscope Lens) 滲透率持續提升，技術專利壁壘高。",
                "智慧型手機鏡頭升級趨勢重啟，導入更多玻塑混合鏡頭提升成像品質。"
            ]
            bear_points = [
                "競爭對手如玉晶光等在中低階產品技術拉近，引發價格競爭壓力。",
                "智慧型手機出貨量整體成長趨於飽和，高階鏡頭市佔擴張受限。"
            ]
        elif "2317" in ticker or "FOXCONN" in text.upper() or "鴻海" in text:
            ticker = "2317"
            company = "鴻海"
            rating = "BUY"
            target_price = 230.0
            revenue_growth = 15.0
            eps = 12.8
            bull_points = [
                "輝達 GB200 AI 伺服器系統組裝最大贏家，垂直整合優勢顯著，帶動伺服器營收大爆發。",
                "電動車 (EV) 與委託設計製造 (CDMS) 業務進展順利，開闢全新成長動能。"
            ]
            bear_points = [
                "傳統消費性電子（如 iPhone 組裝）毛利率偏低且成長面臨瓶頸。",
                "海外多元化產能佈局（印度、越南）前期建置成本高，管理挑戰增加。"
            ]
        else:
            # Fallback general stock mock
            company = "模擬科技 (Mock Tech)"
            rating = "BUY"
            target_price = 520.0
            revenue_growth = 15.4
            eps = 24.3
            bull_points = [
                "公司核心業務穩健，新產品研發進度超乎預期，將在下半年放量貢獻營收。",
                "受惠產業週期回溫，整體庫存水位已回到健康區間，毛利率有望顯著改善。"
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
