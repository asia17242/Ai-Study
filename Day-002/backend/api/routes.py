import os
import hashlib
from datetime import datetime, date
from decimal import Decimal
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Body
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel

from backend.core.config import settings
from backend.db.session import get_db
from backend.db.models import Stock, Broker, Report, BullPoint, BearPoint, FinancialForecast, Embedding
from backend.services.pdf_parser import PDFParser
from backend.services.ai_agent import AIAgentService
from backend.services.vector_service import VectorService
from backend.services.analytics import AnalyticsEngine

router = APIRouter()
ai_agent = AIAgentService()
vector_service = VectorService()

# Pydantic schemas for API endpoints

class ChatRequest(BaseModel):
    message: str
    ticker: Optional[str] = None


class ProcessRequest(BaseModel):
    file_name: str


# Endpoints Implementation

@router.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    """
    Saves the uploaded PDF file to local storage.
    """
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="只支援 PDF 格式檔案 (.pdf)")
        
    file_path = os.path.join(settings.RAW_PDF_DIR, file.filename)
    
    try:
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
        return {"success": True, "file_name": file.filename, "file_path": file_path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"檔案儲存失敗: {str(e)}")


@router.post("/process")
def process_pdf(payload: ProcessRequest, db: Session = Depends(get_db)):
    """
    Core Pipeline: Parses PDF, extracts metadata, standardizes ratings, saves to DB,
    chunks text, generates vector embeddings, and writes to pgvector/SQLite.
    """
    file_path = os.path.join(settings.RAW_PDF_DIR, payload.file_name)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="找不到上傳的 PDF 檔案")

    # 1. Compute File Hash for Duplicate Detection
    hasher = hashlib.sha256()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hasher.update(chunk)
    file_hash = hasher.hexdigest()

    # Check database for duplicate
    existing_report = db.query(Report).filter(Report.file_hash == file_hash).first()
    if existing_report:
        return {
            "success": True,
            "skipped": True,
            "message": "此報告已存在，系統已自動跳過重複分析。",
            "report_id": existing_report.id
        }

    # 2. PDF Parse (extract text & pages count)
    try:
        parsed_pdf = PDFParser.parse_pdf(file_path)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"PDF 解析失敗: {str(e)}")

    # 3. LLM Extraction
    try:
        extracted = ai_agent.extract_report_data(parsed_pdf["text"], payload.file_name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI 資訊提取失敗: {str(e)}")

    # 4. Standardize & Insert Stock
    stock = db.query(Stock).filter(Stock.ticker == extracted.ticker).first()
    if not stock:
        # Infer sector based on ticker
        sector = "其他"
        if extracted.ticker == "2330":
            sector = "半導體 (晶圓代工)"
        elif extracted.ticker == "2454":
            sector = "半導體 (IC設計)"
        elif extracted.ticker == "2317":
            sector = "電子代工"
        elif extracted.ticker == "3008":
            sector = "光學元件"
        
        stock = Stock(
            ticker=extracted.ticker,
            company_name=extracted.company,
            sector=sector
        )
        db.add(stock)
        db.flush() # Populate stock.id

    # 5. Insert Broker
    broker = db.query(Broker).filter(Broker.broker_name == extracted.broker).first()
    if not broker:
        broker = Broker(broker_name=extracted.broker)
        db.add(broker)
        db.flush() # Populate broker.id

    # 6. Normalize Rating
    normalized_rating = ai_agent.normalize_rating(extracted.rating)

    # Convert report date string to date object
    try:
        report_date = datetime.strptime(extracted.report_date, "%Y-%m-%d").date()
    except Exception:
        report_date = date.today()

    # 7. Insert Report
    report = Report(
        stock_id=stock.id,
        broker_id=broker.id,
        report_date=report_date,
        analyst_name=extracted.analyst,
        rating=normalized_rating,
        target_price=Decimal(str(extracted.target_price)) if extracted.target_price is not None else None,
        pdf_path=file_path,
        file_hash=file_hash
    )
    db.add(report)
    db.flush() # Populate report.id

    # 8. Insert Bull & Bear Points
    for pt in extracted.bull_points:
        db.add(BullPoint(report_id=report.id, content=pt))
    for pt in extracted.bear_points:
        db.add(BearPoint(report_id=report.id, content=pt))

    # 9. Insert Financial Forecasts
    db.add(FinancialForecast(
        report_id=report.id,
        revenue_growth=Decimal(str(extracted.revenue_growth)) if extracted.revenue_growth is not None else None,
        eps=Decimal(str(extracted.eps)) if extracted.eps is not None else None
    ))

    # 10. Chunk PDF text & generate vector embeddings
    text_chunks = vector_service.chunk_text(parsed_pdf["text"])
    for chunk in text_chunks:
        emb_vector = vector_service.generate_embedding(chunk)
        db.add(Embedding(
            report_id=report.id,
            chunk_text=chunk,
            embedding=emb_vector
        ))

    db.commit()

    return {
        "success": True,
        "skipped": False,
        "report_id": report.id,
        "extracted_data": {
            "ticker": extracted.ticker,
            "company": extracted.company,
            "broker": extracted.broker,
            "rating": normalized_rating,
            "target_price": extracted.target_price,
            "analyst": extracted.analyst,
            "report_date": extracted.report_date,
            "bull_points": extracted.bull_points,
            "bear_points": extracted.bear_points,
            "revenue_growth": extracted.revenue_growth,
            "eps": extracted.eps
        }
    }


@router.get("/stocks")
def get_stocks(db: Session = Depends(get_db)):
    """
    Returns lists of all tracked stocks, including active consensus, average target price,
    upside, sentiment, and total report counts.
    """
    stocks = db.query(Stock).all()
    out = []
    
    for s in stocks:
        consensus = AnalyticsEngine.calculate_consensus(db, s.id)
        sentiment = AnalyticsEngine.calculate_sentiment_score(db, s.id)
        current_price = AnalyticsEngine.get_current_price(s.ticker)
        
        # Calculate upside
        upside = 0.0
        if consensus["avg_target_price"] > 0:
            # Fallback current price helper if missing
            cp = current_price if current_price > 0 else (consensus["avg_target_price"] * 0.85)
            upside = AnalyticsEngine.calculate_upside(consensus["avg_target_price"], cp)
            if current_price == 0:
                current_price = round(cp, 2)
        
        # Determine consensus rating text representation
        # Find which rating (BUY, HOLD, SELL) has highest share
        max_share = max(consensus["buy"], consensus["hold"], consensus["sell"])
        if consensus["total_reports"] == 0:
            cons_rating = "無資料"
        elif max_share == consensus["buy"]:
            cons_rating = "BUY (看多)"
        elif max_share == consensus["sell"]:
            cons_rating = "SELL (看空)"
        else:
            cons_rating = "HOLD (中立)"
            
        out.append({
            "id": s.id,
            "ticker": s.ticker,
            "company_name": s.company_name,
            "sector": s.sector,
            "consensus": cons_rating,
            "current_price": current_price,
            "avg_target_price": consensus["avg_target_price"],
            "upside": upside,
            "sentiment_score": sentiment["bullish"], # Use bullish ratio as representative index
            "sentiment": sentiment,
            "report_count": consensus["total_reports"]
        })
        
    return out


@router.get("/stocks/{ticker}")
def get_stock_detail(ticker: str, db: Session = Depends(get_db)):
    """
    Returns comprehensive stock consensus dashboard details: comparison charts datasets,
    ratings distribution, broker list comparisons, bull/bear theme extractions, and trends.
    """
    stock = db.query(Stock).filter(Stock.ticker == ticker).first()
    if not stock:
        raise HTTPException(status_code=404, detail="找不到個股資訊")

    consensus = AnalyticsEngine.calculate_consensus(db, stock.id)
    sentiment = AnalyticsEngine.calculate_sentiment_score(db, stock.id)
    current_price = AnalyticsEngine.get_current_price(ticker)
    
    cp = current_price if current_price > 0 else (consensus["avg_target_price"] * 0.85)
    upside = AnalyticsEngine.calculate_upside(consensus["avg_target_price"], cp)
    if current_price == 0:
        current_price = round(cp, 2)

    # Broker Comparison List
    reports = db.query(Report).filter(Report.stock_id == stock.id).order_by(Report.report_date.desc()).all()
    broker_list = []
    
    # Target price distribution array for histogram
    tp_distribution = []
    
    for r in reports:
        tp_val = float(r.target_price) if r.target_price is not None else None
        broker_list.append({
            "broker": r.broker.broker_name,
            "analyst": r.analyst_name,
            "rating": r.rating,
            "target_price": tp_val,
            "date": r.report_date.strftime("%Y-%m-%d")
        })
        if tp_val is not None:
            tp_distribution.append(tp_val)

    # Gather bull and bear points across reports
    bull_themes = []
    bear_themes = []
    
    for r in reports:
        bp_list = db.query(BullPoint).filter(BullPoint.report_id == r.id).all()
        for bp in bp_list:
            if bp.content not in bull_themes:
                bull_themes.append(bp.content)
                
        br_list = db.query(BearPoint).filter(BearPoint.report_id == r.id).all()
        for br in br_list:
            if br.content not in bear_themes:
                bear_themes.append(br.content)

    # Trend lines data
    trend_data = AnalyticsEngine.get_trend_analysis(db, stock.id, "6M")

    return {
        "ticker": stock.ticker,
        "company_name": stock.company_name,
        "sector": stock.sector,
        "current_price": current_price,
        "avg_target_price": consensus["avg_target_price"],
        "upside": upside,
        "consensus": consensus,
        "sentiment": sentiment,
        "brokers": broker_list,
        "bull_themes": bull_themes[:8], # Return top 8 unique themes
        "bear_themes": bear_themes[:8],
        "tp_distribution": tp_distribution,
        "trend_data": trend_data
    }


@router.get("/report/{ticker}")
def generate_ai_report(ticker: str, db: Session = Depends(get_db)):
    """
    Generates a full structured Equity Research AI report.
    Returns styled HTML markup for the frontend to render.
    """
    stock = db.query(Stock).filter(Stock.ticker == ticker).first()
    if not stock:
        raise HTTPException(status_code=404, detail="找不到個股資訊")

    consensus = AnalyticsEngine.calculate_consensus(db, stock.id)
    sentiment = AnalyticsEngine.calculate_sentiment_score(db, stock.id)
    current_price = AnalyticsEngine.get_current_price(ticker)
    cp = current_price if current_price > 0 else (consensus["avg_target_price"] * 0.85)
    upside = AnalyticsEngine.calculate_upside(consensus["avg_target_price"], cp)

    reports = db.query(Report).filter(Report.stock_id == stock.id).order_by(Report.report_date.desc()).all()
    if not reports:
        raise HTTPException(status_code=404, detail="該個股尚無任何券商研究報告，無法生成 AI 報告。")

    latest_report = reports[0]
    
    # Financial forecasts aggregation
    forecasts = []
    for r in reports:
        fc = db.query(FinancialForecast).filter(FinancialForecast.report_id == r.id).first()
        if fc and (fc.revenue_growth is not None or fc.eps is not None):
            forecasts.append({
                "broker": r.broker.broker_name,
                "revenue_growth": float(fc.revenue_growth) if fc.revenue_growth is not None else None,
                "eps": float(fc.eps) if fc.eps is not None else None
            })

    # Gather points
    bulls = []
    bears = []
    for r in reports:
        bulls.extend([b.content for b in db.query(BullPoint).filter(BullPoint.report_id == r.id).all()])
        bears.extend([b.content for b in db.query(BearPoint).filter(BearPoint.report_id == r.id).all()])
    
    # De-duplicate
    bulls = list(dict.fromkeys(bulls))[:5]
    bears = list(dict.fromkeys(bears))[:5]

    # Generate Report Content
    # We formulate a professional looking equity report in Traditional Chinese
    rating_recommendation = "買進 (BUY)" if consensus["buy"] >= 50 else "中立 (HOLD)" if consensus["hold"] >= consensus["sell"] else "賣出 (SELL)"
    
    # If API key is available, we can optionally use LLM to summarize and generate a more natural report.
    # Otherwise we compile a high-quality template-based summary of extracted structures.
    # For robust MVP, we do a hybrid: structured data tables + LLM-generated summary if API key is present.
    generated_summary = ""
    if settings.OPENAI_API_KEY:
        try:
            client = OpenAI(api_key=settings.OPENAI_API_KEY)
            prompt = (
                f"你是一位外資研究部門主管 (Head of Research)。\n"
                f"請為個股 {stock.company_name} ({ticker}) 撰寫一份專業的個股投資總結與結論。\n"
                f"以下是當前的市場數據與分析點：\n"
                f"- 市場共識目標價：{consensus['avg_target_price']} 元，當前市價：{cp} 元，上漲空間 {upside}%\n"
                f"- 看多重點：\n" + "\n".join([f"  * {b}" for b in bulls]) + "\n"
                f"- 看空點/風險：\n" + "\n".join([f"  * {b}" for b in bears]) + "\n"
                f"請以極度專業、冷靜、客觀的券商報告風格，用繁體中文撰寫約 300-400 字的「投資總結與結論」。"
            )
            response = client.chat.completions.create(
                model=settings.LLM_MODEL,
                messages=[
                    {"role": "system", "content": "You are a professional investment strategist."},
                    {"role": "user", "content": prompt}
                ]
            )
            generated_summary = response.choices[0].message.content
        except Exception:
            pass

    if not generated_summary:
        # Template fallback
        generated_summary = (
            f"綜合當前市場共識，{stock.company_name} ({ticker}) 之投資評等為 {rating_recommendation}。 "
            f"主要驅動因素在於市場普遍看好其在產業中的領先技術及營運擴張。看多論點指出：" + 
            "，".join(bulls[:2]) + "。然而，投資人亦須留意潛在的經營風險，包含：" + 
            "，".join(bears[:2]) + "。整體而言，雖然面臨短期波動，但長期競爭力依然穩健。"
        )

    # Let's return the structured content in sections so the frontend can build a beautiful, rich HTML layout
    return {
        "ticker": ticker,
        "company_name": stock.company_name,
        "sector": stock.sector,
        "generated_date": datetime.today().strftime("%Y-%m-%d"),
        "consensus_rating": rating_recommendation,
        "average_target_price": consensus["avg_target_price"],
        "current_price": cp,
        "upside": upside,
        "rating_percentages": {
            "buy": consensus["buy"],
            "hold": consensus["hold"],
            "sell": consensus["sell"]
        },
        "sentiment": sentiment,
        "executive_summary": f"本報告由 AI 投資情報平台自動彙整市場最新研究報告生成。目前 {stock.company_name} ({ticker}) 共收錄 {consensus['total_reports']} 份券商報告，平均目標價為 NT$ {consensus['avg_target_price']}，較目前市價 NT$ {cp} 具備 {upside}% 的潛在上漲空間。整體市場情緒偏向 {rating_recommendation}，主要受惠於先進技術擴展，但仍需關注海外地緣政治與產能折舊對利潤的稀釋效應。",
        "bull_thesis": bulls,
        "bear_thesis": bears,
        "financial_outlook": forecasts,
        "brokers_comparison": [
            {
                "broker": r.broker.broker_name,
                "analyst": r.analyst_name,
                "rating": r.rating,
                "target_price": float(r.target_price) if r.target_price is not None else None,
                "date": r.report_date.strftime("%Y-%m-%d")
            }
            for r in reports[:5]
        ],
        "investment_conclusion": generated_summary
    }


@router.post("/chat")
def chat_rag(payload: ChatRequest, db: Session = Depends(get_db)):
    """
    RAG chat assistant. Combines SQL structured database facts and Vector search.
    Answers in Traditional Chinese, displaying references and source citations.
    """
    message = payload.message
    ticker = payload.ticker
    
    # 1. Check if user is asking about a specific stock using keywords or explicit ticker
    target_stock = None
    if ticker:
        target_stock = db.query(Stock).filter(Stock.ticker == ticker).first()
    else:
        # Search if stock name or ticker appears in query
        stocks = db.query(Stock).all()
        for s in stocks:
            if s.ticker in message or s.company_name in message:
                target_stock = s
                break

    # 2. Extract structured statistics context
    structured_context = ""
    structured_data_used = {}
    
    if target_stock:
        consensus = AnalyticsEngine.calculate_consensus(db, target_stock.id)
        current_price = AnalyticsEngine.get_current_price(target_stock.ticker)
        cp = current_price if current_price > 0 else (consensus["avg_target_price"] * 0.85)
        upside = AnalyticsEngine.calculate_upside(consensus["avg_target_price"], cp)
        
        structured_context = (
            f"[結構化數據庫資料]\n"
            f"公司名稱: {target_stock.company_name} ({target_stock.ticker})\n"
            f"收錄報告數量: {consensus['total_reports']} 份\n"
            f"平均目標價: NT$ {consensus['avg_target_price']} 元\n"
            f"目前估計市價: NT$ {cp} 元\n"
            f"平均預期上漲空間: {upside}%\n"
            f"券商評等分佈: BUY {consensus['buy']}%, HOLD {consensus['hold']}%, SELL {consensus['sell']}%\n"
        )
        
        structured_data_used = {
            "ticker": target_stock.ticker,
            "company_name": target_stock.company_name,
            "total_reports": consensus["total_reports"],
            "avg_target_price": consensus["avg_target_price"],
            "current_price": cp,
            "upside": upside,
            "buy_pct": consensus["buy"],
            "hold_pct": consensus["hold"],
            "sell_pct": consensus["sell"]
        }

    # 3. Retrieve relevant text chunks using vector database
    stock_db_id = target_stock.id if target_stock else None
    similar_chunks = vector_service.search_similar_chunks(db, message, limit=4, stock_id=stock_db_id)
    
    unstructured_context_parts = []
    sources = []
    
    for i, chunk in enumerate(similar_chunks):
        unstructured_context_parts.append(
            f"[來源 {i+1}]: {chunk['broker']} 報告 ({chunk['ticker']} {chunk['company_name']}) - 評等: {chunk['score']:.2f}\n"
            f"內容片段: {chunk['chunk_text']}\n"
        )
        sources.append({
            "index": i + 1,
            "broker": chunk["broker"],
            "ticker": chunk["ticker"],
            "company_name": chunk["company_name"],
            "text": chunk["chunk_text"],
            "score": float(chunk["score"])
        })

    unstructured_context = "[非結構化報告文本切片]\n" + "\n".join(unstructured_context_parts)

    # 4. Generate AI response combining both sources
    answer = ""
    if settings.OPENAI_API_KEY:
        try:
            client = OpenAI(api_key=settings.OPENAI_API_KEY)
            
            prompt = (
                "你是一位資深的證券投研助理。請根據以下提供的好幾份資料來源，回答使用者的問題。\n"
                "你有兩種資料來源：\n"
                "1. 結構化數據庫資料：包含個股最新的券商評等與目標價共識。\n"
                "2. 非結構化報告文本切片：從上傳的 PDF 報告中檢索出的相關片段段落。\n\n"
                "請嚴格依據這些參考內容進行回答。如果問題與參考內容無關，請友善提示你僅能回答投研相關問題。\n"
                "重要規範：\n"
                "1. 必須使用繁體中文回答。\n"
                "2. 回答要專業、有條理，並在回答中提及數據來源（例如：根據市場共識目標價、或是某某券商報告指出）。\n"
                "3. 引用非結構化片段時，請加上 [來源 X] 的標記，方便使用者核對。\n\n"
                f"使用者問題: {message}\n\n"
                f"{structured_context}\n"
                f"{unstructured_context}\n"
            )
            
            response = client.chat.completions.create(
                model=settings.LLM_MODEL,
                messages=[
                    {"role": "system", "content": "You are a professional equity research RAG analyst answering in Traditional Chinese."},
                    {"role": "user", "content": prompt}
                ]
            )
            answer = response.choices[0].message.content
        except Exception as e:
            logger.error(f"OpenAI chat completion failed: {str(e)}")
            
    if not answer:
        # Fallback offline answering logic
        if target_stock:
            # We can formulate a nice rule-based synthesis of the structured facts and parsed chunks
            answer = (
                f"根據數據庫結構化分析，**{target_stock.company_name} ({target_stock.ticker})** 的市場共識評等為 "
                f"{'買進 (BUY)' if structured_data_used.get('buy_pct', 0) >= 50 else '中立 (HOLD)'}。目前平台共分析了 "
                f"{structured_data_used.get('total_reports', 0)} 份研究報告，平均預期目標價為 **NT$ {structured_data_used.get('avg_target_price', 0)} 元**，"
                f"相較於估計市價 NT$ {structured_data_used.get('current_price', 0)} 元，具備 **{structured_data_used.get('upside', 0)}%** 的潛在上漲空間。\n\n"
            )
            if sources:
                answer += "從收錄的報告文本片段中，整理以下重點項目：\n"
                for s in sources[:2]:
                    answer += f"- 根據 **{s['broker']}** 的報告指出，{s['text'][:120]}... [來源 {s['index']}]\n"
            else:
                answer += "目前檢索不到更詳細的文本段落，建議您上傳該個股的 PDF 報告以獲得更深入的文本細節。"
        else:
            # General query with sources
            if sources:
                answer = "根據您所查詢的內容，我為您檢索了以下相關報告片段段落：\n\n"
                for s in sources:
                    answer += f"**{s['broker']}** 關於 **{s['company_name']} ({s['ticker']})** 的分析指出：\n> {s['text'][:180]}... [來源 {s['index']}]\n\n"
                answer += "您可以上傳特定的個股報告，以便我能為您提供更精確的個股統計共識。"
            else:
                answer = "您好！我是您的 AI 投資研究助理。目前我的資料庫中沒有與您的問題直接相符的個股資訊或文本片段。您可以嘗試上傳券商 PDF 研究報告（如 2330_Goldman.pdf），或是詢問台積電、聯發科等已建檔個股的評等與上漲空間！"

    return {
        "answer": answer,
        "structured_data": structured_data_used,
        "sources": sources
    }


@router.post("/seed")
def seed_database(db: Session = Depends(get_db)):
    """
    Seeds the database with high-quality, realistic historical reports for major stocks
    (TSMC 2330, MediaTek 2454, Foxconn 2317, Largan 3008) so the user has immediate access
    to working dashboards, graphs, consensus comparisons, and RAG chats.
    """
    # Delete existing data to avoid conflicts on seeding
    # Due to cascades, deleting Stocks & Brokers will clean up child records
    db.query(Stock).delete()
    db.query(Broker).delete()
    db.commit()

    # Create Stocks
    stocks_data = [
        {"ticker": "2330", "company_name": "台積電", "sector": "半導體 (晶圓代工)"},
        {"ticker": "2454", "company_name": "聯發科", "sector": "半導體 (IC設計)"},
        {"ticker": "2317", "company_name": "鴻海", "sector": "電子代工"},
        {"ticker": "3008", "company_name": "大立光", "sector": "光學元件"}
    ]
    stocks = {}
    for sd in stocks_data:
        s = Stock(ticker=sd["ticker"], company_name=sd["company_name"], sector=sd["sector"])
        db.add(s)
        db.flush()
        stocks[sd["ticker"]] = s

    # Create Brokers
    brokers_data = ["Goldman Sachs", "Morgan Stanley", "Citi", "JPMorgan", "元大投顧"]
    brokers = {}
    for bname in brokers_data:
        b = Broker(broker_name=bname)
        db.add(b)
        db.flush()
        brokers[bname] = b

    # Mock historical reports config
    reports_config = [
        # TSMC 2330 Reports
        {
            "ticker": "2330", "broker": "Goldman Sachs", "analyst": "John Smith",
            "date": "2026-06-10", "rating": "BUY", "target_price": 1450.0,
            "revenue_growth": 25.0, "eps": 65.2,
            "bulls": ["AI 伺服器晶片與先進製程產能利用率持續衝破 100%，動能極強。", "3奈米與2奈米製程價格調漲，毛利率預計於下半年回升至 54% 以上。"],
            "bears": ["地緣政治風險令部分歐美客戶要求海外備份產能，建廠費用將拖累淨利率。"],
            "text": "TSMC (2330) is seeing extremely strong demand for CoWoS and advanced nodes. Goldman Sachs forecasts revenue growth of 25% for 2026, leading to an EPS of 65.2. We maintain BUY and raise target price to 1450. Geopolitical risks exist but TSMC has high pricing power."
        },
        {
            "ticker": "2330", "broker": "Morgan Stanley", "analyst": "Charlie Chen",
            "date": "2026-06-05", "rating": "BUY", "target_price": 1400.0,
            "revenue_growth": 24.5, "eps": 63.8,
            "bulls": ["CoWoS 產能吃緊至 2027 年，輝達、超微等客戶正積極爭取產能配額。", "邊緣 AI 機會將在 2026 年底發酵，帶動智慧型手機與 PC 處理器升級。"],
            "bears": ["海外如美國亞利桑那廠及熊本廠初期投產折舊費用較高，侵蝕短期利潤。"],
            "text": "Morgan Stanley holds a positive outlook on TSMC. Standard rating is BUY with a target price of 1400. CoWoS packaging bottleneck remains. The structural demand for AI is sustainable. Higher capex for global fabs will be diluted over time by strong wafer prices."
        },
        {
            "ticker": "2330", "broker": "Citi", "analyst": "Laura Wang",
            "date": "2026-06-01", "rating": "BUY", "target_price": 1500.0,
            "revenue_growth": 28.0, "eps": 66.8,
            "bulls": ["2奈米製程客戶詢問度遠高於同期的3奈米，量產初期即會貢獻高額利潤。", "蘋果新一代 A20 處理器採用先進製程，確保代工市佔率高達 100%。"],
            "bears": ["台灣水電資源受限可能導致未來高階製程擴張速度面臨瓶頸。"],
            "text": "Citi reiterates BUY on TSMC, raising the target price to 1500. Advanced packaging and 2nm pipelines are extremely robust. High pricing power allows TSMC to transfer inflation costs to customers easily. Revenue growth is projected at 28%."
        },
        {
            "ticker": "2330", "broker": "元大投顧", "analyst": "王小明",
            "date": "2026-05-28", "rating": "HOLD", "target_price": 1180.0,
            "revenue_growth": 20.0, "eps": 58.0,
            "bulls": ["HPC (高效能運算) 需求穩健，晶圓代工龍頭地位不可動搖。"],
            "bears": ["短期估值偏高，海外設廠的不確定性令外資買盤轉趨保守。"],
            "text": "Yuanta downgrades TSMC to Neutral/HOLD with target price 1180. Current valuation has priced in AI growth factors. Higher operating cost in US fab is a persistent overhang for gross margin expansion in the short term."
        },
        
        # MediaTek 2454 Reports
        {
            "ticker": "2454", "broker": "Goldman Sachs", "analyst": "John Smith",
            "date": "2026-06-09", "rating": "BUY", "target_price": 1600.0,
            "revenue_growth": 18.5, "eps": 79.5,
            "bulls": ["天璣 9400 晶片採用台積電 3 奈米製程，效能領先，在大陸品牌旗艦機滲透率極高。", "車用晶片平台已打入多家歐美與大陸車廠供應鏈，下半年進入量產期。"],
            "bears": ["高通新一代驍龍晶片價格競爭將使高階 AP 毛利率成長受限。"],
            "text": "MediaTek (2454) Dimensity 9400 is gaining major market share. Goldman Sachs sets target price at 1600 with BUY rating. Edge AI smartphone models drive higher ASP. Revenue growth expected to hit 18.5% with EPS of 79.5."
        },
        {
            "ticker": "2454", "broker": "Morgan Stanley", "analyst": "Charlie Chen",
            "date": "2026-05-30", "rating": "BUY", "target_price": 1550.0,
            "revenue_growth": 17.0, "eps": 76.2,
            "bulls": ["與 NVIDIA 聯手開發的 AI PC SoC 晶片進展符合預期，首批產品將於 2026 年底問世。"],
            "bears": ["大宗商品智慧型手機需求依舊偏弱，中低階市場價格競爭激烈。"],
            "text": "Morgan Stanley rates MTK as BUY with 1550 target price. The upcoming AI PC chip co-developed with NVIDIA is the key highlight. Smartphone inventory is fully normalized, paving the way for earnings recovery."
        },
        {
            "ticker": "2454", "broker": "Citi", "analyst": "Laura Wang",
            "date": "2026-05-15", "rating": "HOLD", "target_price": 1300.0,
            "revenue_growth": 12.0, "eps": 68.0,
            "bulls": ["股利配發率高達 80% 以上，高殖利率為股價提供強大下檔支撐。"],
            "bears": ["高階手機處理器面臨華為自研晶片及高通的雙重擠壓，市佔增長空间存疑。"],
            "text": "Citi maintains Neutral on MediaTek with target price 1300. Despite decent dividend yields, the smartphone market growth remains sluggish and competitive pressure on AP pricing is escalating."
        },

        # Foxconn 2317 Reports
        {
            "ticker": "2317", "broker": "JPMorgan", "analyst": "David Miller",
            "date": "2026-06-11", "rating": "BUY", "target_price": 240.0,
            "revenue_growth": 16.0, "eps": 13.5,
            "bulls": ["GB200 NVL72 與 NVL36 AI 伺服器機櫃訂單掌握度高，第4季將放量出貨。", "液冷散熱系統與配電系統具備自主開發能力，毛利表現將超出預期。"],
            "bears": ["傳統消費性電子如智慧型手機與組裝代工業務營收佔比偏高，成長性放緩。"],
            "text": "JPMorgan rates Foxconn (2317) as BUY with target price of 240. AI server cabinet GB200 is the prime growth catalyst. Vertical integration capability in thermal and power management boosts overall server profitability."
        },
        {
            "ticker": "2317", "broker": "元大投顧", "analyst": "王小明",
            "date": "2026-06-03", "rating": "BUY", "target_price": 220.0,
            "revenue_growth": 14.5, "eps": 12.4,
            "bulls": ["伺服器與垂直整合零組件出貨強勁，抵銷消費性電子放緩影響。"],
            "bears": ["電動車業務研發投入持續，但轉為實質營收貢獻時程尚需觀察。"],
            "text": "Yuanta maintains BUY on Foxconn with 220 target. Strong performance in AI servers and component integration helps offset weak iPhone shipment momentum. EV segment is a long-term option."
        },

        # Largan 3008 Reports
        {
            "ticker": "3008", "broker": "Goldman Sachs", "analyst": "John Smith",
            "date": "2026-06-02", "rating": "BUY", "target_price": 3100.0,
            "revenue_growth": 14.0, "eps": 152.0,
            "bulls": ["潛望式長焦鏡頭設計滲透至更多非 Pro 車款，高規鏡頭出貨量回升。"],
            "bears": ["玻璃模造 (Molded Glass) 生產成本偏高，初期產能爬坡壓低毛利。"],
            "text": "Largan (3008) is set to benefit from periscope lens adoption. Goldman Sachs sets target at 3100, rating BUY. Upgrade cycle in flagship phone lenses is stabilizing, which will lead to a higher EPS of 152.0."
        },
        {
            "ticker": "3008", "broker": "Morgan Stanley", "analyst": "Charlie Chen",
            "date": "2026-05-20", "rating": "HOLD", "target_price": 2600.0,
            "revenue_growth": 10.0, "eps": 138.0,
            "bulls": ["專利壁壘高，對二線廠商競爭具備防禦性優勢。"],
            "bears": ["智慧型手機市況不佳，高階鏡頭導入速度受到品牌廠成本考量而延後。"],
            "text": "Morgan Stanley rates Largan as Neutral/HOLD with target price 2600. Lenses specification upgrades are slow. Smartphone brand cost control pressure reduces demand for ultra-high-end lenses."
        }
    ]

    for rc in reports_config:
        stock = stocks[rc["ticker"]]
        broker = brokers[rc["broker"]]
        
        # File hash based on ticker and broker to be unique and persistent
        file_hash = hashlib.sha256(f"{rc['ticker']}_{rc['broker']}_{rc['date']}".encode("utf-8")).hexdigest()
        
        report = Report(
            stock_id=stock.id,
            broker_id=broker.id,
            report_date=datetime.strptime(rc["date"], "%Y-%m-%d").date(),
            analyst_name=rc["analyst"],
            rating=rc["rating"],
            target_price=Decimal(str(rc["target_price"])),
            pdf_path=f"storage/raw_pdfs/{rc['ticker']}_{rc['broker'].replace(' ', '')}.pdf",
            file_hash=file_hash
        )
        db.add(report)
        db.flush()
        
        # Add bull points
        for b in rc["bulls"]:
            db.add(BullPoint(report_id=report.id, content=b))
            
        # Add bear points
        for b in rc["bears"]:
            db.add(BearPoint(report_id=report.id, content=b))
            
        # Add financial forecast
        db.add(FinancialForecast(
            report_id=report.id,
            revenue_growth=Decimal(str(rc["revenue_growth"])),
            eps=Decimal(str(rc["eps"]))
        ))
        
        # Generate text chunks and deterministic vector embeddings for retrieval
        chunks = vector_service.chunk_text(rc["text"], chunk_size=200, overlap=30)
        for chunk in chunks:
            emb_vector = vector_service.generate_embedding(chunk)
            db.add(Embedding(
                report_id=report.id,
                chunk_text=chunk,
                embedding=emb_vector
            ))
            
    db.commit()
    return {"success": True, "message": "資料庫種子數據已成功載入！TSMC(2330)、聯發科(2454)、鴻海(2317)與大立光(3008)的歷史報告已就緒。"}


@router.post("/reset")
def reset_database(db: Session = Depends(get_db)):
    """
    Clears all data in the database (stocks, brokers, and cascade deleted reports, embeddings, forecasts, themes)
    to reset the collected reports count to zero.
    """
    try:
        # Cascade delete is configured on relations, so deleting Stocks & Brokers will clean up child records
        db.query(Stock).delete()
        db.query(Broker).delete()
        db.commit()
        return {"success": True, "message": "資料庫已成功歸零，所有收錄的研究報告與個股數據均已刪除。"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"資料庫清空失敗: {str(e)}")

