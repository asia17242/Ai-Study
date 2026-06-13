import json
import hashlib
from pathlib import Path

import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go

from config.settings import RAW_PDFS_DIR, PROCESSED_DIR
from agents.metadata_agent import MetadataAgent
from agents.financial_agent import FinancialAgent
from agents.consensus_agent import ConsensusAgent
from core.normalizer import Normalizer
from core.analyzer import Analyzer
from db.vector_store import VectorStore
from app.style import kpi_card_html, apply_plotly_theme
from app.translations import TRANSLATIONS


def normalize_path(p):
    return Path(str(p))


def show_dashboard():
    lang = st.session_state.get("language", "繁體中文")
    t = TRANSLATIONS[lang]
    
    st.markdown(f'<div class="gradient-text">{t["dash_title"]}</div>', unsafe_allow_html=True)
    st.markdown(f'<div class="gradient-subtitle">{t["dash_subtitle"]}</div>', unsafe_allow_html=True)

    processed_dir = normalize_path(PROCESSED_DIR)
    raw_dir = normalize_path(RAW_PDFS_DIR)

    pdf_files = list(raw_dir.glob("*.pdf"))
    processed_files = list(processed_dir.glob("*.json"))

    col1, col2, col3 = st.columns(3)
    with col1:
        kpi_card_html(t["dash_queue"], str(len(pdf_files) - len(processed_files)), t["dash_queue_desc"], "#FFA15A")
    with col2:
        kpi_card_html(t["dash_processed"], str(len(processed_files)), t["dash_processed_desc"], "#00cc96")
    with col3:
        kpi_card_html(t["dash_tracked"], str(len(set(f.stem.split("_")[0] for f in processed_files))), t["dash_tracked_desc"], "#00D2FF")

    st.divider()

    if st.button(t["dash_btn_scan"]):
        with st.spinner(t["dash_scanning"]):
            results = process_pdfs(raw_dir, processed_dir)
            if results:
                st.success(t["dash_scan_success"].format(len(results)))
                st.rerun()
            else:
                st.info(t["dash_scan_no_new"])

    st.divider()

    all_data = load_all_processed(processed_dir)
    if not all_data:
        st.info(t["dash_no_data"])
        return

    tickers = sorted(set(d["ticker"] for d in all_data if d.get("ticker")))
    if not tickers:
        st.warning(t["dash_no_stocks"])
        return

    selected_ticker = st.selectbox(t["dash_select_stock"], tickers)
    stock_data = [d for d in all_data if d.get("ticker") == selected_ticker]

    if not stock_data:
        return

    analyzer = Analyzer()
    consensus_agent = ConsensusAgent()

    ratings = []
    bull_bear = []
    for d in stock_data:
        if d.get("rating_standard"):
            ratings.append({
                "target_price": d.get("target_price", 0),
                "rating_standard": d.get("rating_standard", ""),
                "broker": d.get("broker", ""),
                "report_date": d.get("report_date", ""),
            })
        for bp in d.get("bull_points", []):
            bull_bear.append({"point_type": "bull", "description": bp, "category": ""})
        for bp in d.get("bear_points", []):
            bull_bear.append({"point_type": "bear", "description": bp, "category": ""})

    consensus = analyzer.consensus_analysis(ratings)
    sentiment = analyzer.sentiment_score(bull_bear)
    themes = analyzer.bull_bear_themes(bull_bear)

    company = stock_data[0].get("company", selected_ticker)

    st.markdown(f'<h3 style="color: #00F0FF; font-weight: 700; margin-top: 20px; margin-bottom: 15px;">{company} ({selected_ticker})</h3>', unsafe_allow_html=True)

    kpi_cols = st.columns(4)
    consensus_rating = consensus_agent._determine_consensus_rating(consensus.get("rating_distribution", {}))
    rating_display = t[f"rating_{consensus_rating.lower()}"] if f"rating_{consensus_rating.lower()}" in t else consensus_rating
    rating_color = "#00cc96" if consensus_rating == "BUY" else ("#ffa15a" if consensus_rating == "HOLD" else "#ef553b")
    
    with kpi_cols[0]:
        kpi_card_html(t["card_consensus"], rating_display, t["card_consensus_desc"], rating_color)
    with kpi_cols[1]:
        kpi_card_html(t["card_avg_target"], f"{consensus['avg_target_price']:,.0f}", t["card_avg_target_range"].format(f"{consensus.get('low_target_price', 0):,.0f}", f"{consensus.get('high_target_price', 0):,.0f}"), "#00D2FF")
    with kpi_cols[2]:
        kpi_card_html(t["card_sentiment"], f"{sentiment['bullish']}%", t["card_sentiment_desc"].format(sentiment['bearish']), "#00cc96" if sentiment['bullish'] > 50 else "#ffa15a")
    with kpi_cols[3]:
        kpi_card_html(t["card_reports"], str(consensus["total_reports"]), t["card_reports_desc"], "#7928CA")

    st.divider()

    chart_col1, chart_col2 = st.columns(2)

    with chart_col1:
        st.subheader(t["section_rating_dist"])
        if consensus["rating_distribution"]:
            # Translate rating distribution labels
            translated_dist = {}
            for k, v in consensus["rating_distribution"].items():
                label_trans = t[f"rating_{k.lower()}"] if f"rating_{k.lower()}" in t else k
                translated_dist[label_trans] = v
            dist_df = pd.DataFrame(
                list(translated_dist.items()),
                columns=["Rating", "Count"]
            )
            colors = {t["rating_buy"]: "#00cc96", t["rating_hold"]: "#ffa15a", t["rating_sell"]: "#ef553b"}
            fig = px.pie(dist_df, values="Count", names="Rating",
                         color="Rating", color_discrete_map=colors)
            st.plotly_chart(apply_plotly_theme(fig), use_container_width=True)

    with chart_col2:
        st.subheader(t["section_sentiment_breakdown"])
        sent_df = pd.DataFrame(
            list(sentiment.items()),
            columns=["Sentiment", "Percentage"]
        )
        fig = px.bar(sent_df, x="Sentiment", y="Percentage",
                     color="Sentiment",
                     color_discrete_map={
                         "bullish": "#00cc96", "neutral": "#ffa15a", "bearish": "#ef553b"
                     })
        st.plotly_chart(apply_plotly_theme(fig), use_container_width=True)

    st.subheader(t["section_bull_bear"])
    theme_col1, theme_col2 = st.columns(2)
    with theme_col1:
        st.markdown(f"**{t['section_bull_themes']}**")
        if themes["bull_themes"]:
            bull_df = pd.DataFrame(
                list(themes["bull_themes"].items()),
                columns=["Theme", "Count"]
            ).sort_values("Count", ascending=True)
            fig = px.bar(bull_df, x="Count", y="Theme", orientation="h",
                         color_discrete_sequence=["#00cc96"])
            st.plotly_chart(apply_plotly_theme(fig), use_container_width=True)
        else:
            st.caption(t["no_bull_themes"])

    with theme_col2:
        st.markdown(f"**{t['section_bear_themes']}**")
        if themes["bear_themes"]:
            bear_df = pd.DataFrame(
                list(themes["bear_themes"].items()),
                columns=["Theme", "Count"]
            ).sort_values("Count", ascending=True)
            fig = px.bar(bear_df, x="Count", y="Theme", orientation="h",
                         color_discrete_sequence=["#ef553b"])
            st.plotly_chart(apply_plotly_theme(fig), use_container_width=True)
        else:
            st.caption(t["no_bear_themes"])

    st.divider()
    st.subheader(t["section_broker_comp"])
    if ratings:
        broker_df = pd.DataFrame(ratings)
        if not broker_df.empty:
            fig = px.scatter(broker_df, x="broker", y="target_price",
                             color="rating_standard", size="target_price",
                             color_discrete_map={
                                 "BUY": "#00cc96", "HOLD": "#ffa15a", "SELL": "#ef553b"
                             },
                             title="Target Price by Broker")
            st.plotly_chart(apply_plotly_theme(fig), use_container_width=True)

    st.divider()
    with st.expander(t["section_raw_summary"]):
        for d in stock_data:
            st.json(d)


def process_pdfs(raw_dir: Path, processed_dir: Path) -> list[dict]:
    metadata_agent = MetadataAgent()
    normalizer = Normalizer()
    financial_agent = FinancialAgent()

    results = []
    processed_hashes = set()
    for f in processed_dir.glob("*.json"):
        try:
            data = json.loads(f.read_text(encoding="utf-8"))
            if "file_hash" in data:
                processed_hashes.add(data["file_hash"])
        except (json.JSONDecodeError, Exception):
            continue

    for pdf_path in raw_dir.glob("*.pdf"):
        try:
            result = metadata_agent.process(str(pdf_path))
            file_hash = result["pdf_metadata"]["file_hash"]

            if file_hash in processed_hashes:
                continue

            financial_metrics = financial_agent.extract_metrics(
                "", result
            )

            output = {
                "ticker": result["stock_info"]["ticker"],
                "company": result["stock_info"]["company"],
                "broker": result["stock_info"]["broker"],
                "report_date": result["stock_info"]["report_date"],
                "rating_raw": result["rating_info"]["rating_raw"],
                "rating_standard": result["rating_info"]["rating_standard"],
                "target_price": result["rating_info"]["target_price"],
                "currency": result["rating_info"]["currency"],
                "bull_points": result["bull_bear"]["bull_points"],
                "bear_points": result["bull_bear"]["bear_points"],
                "summary": result["summary"],
                "file_name": result["pdf_metadata"]["file_name"],
                "file_hash": file_hash,
                "pages": result["pdf_metadata"]["pages"],
                "financial_metrics": financial_metrics,
            }

            output_path = processed_dir / f"{pdf_path.stem}_processed.json"
            output_path.write_text(
                json.dumps(output, ensure_ascii=False, indent=2),
                encoding="utf-8"
            )

            results.append(output)

        except Exception as e:
            st.error(f"Error processing {pdf_path.name}: {e}")

    return results


def load_all_processed(processed_dir: Path) -> list[dict]:
    data = []
    for f in processed_dir.glob("*.json"):
        try:
            d = json.loads(f.read_text(encoding="utf-8"))
            data.append(d)
        except (json.JSONDecodeError, Exception):
            continue
    return data
