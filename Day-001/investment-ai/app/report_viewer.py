import json
from pathlib import Path

import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go

from config.settings import PROCESSED_DIR, REPORTS_DIR
from core.analyzer import Analyzer
from agents.consensus_agent import ConsensusAgent
from app.style import kpi_card_html, apply_plotly_theme
from app.translations import TRANSLATIONS


def normalize_path(p):
    return Path(str(p))


def show_report(full_report: bool = False):
    lang = st.session_state.get("language", "繁體中文")
    t = TRANSLATIONS[lang]

    if full_report:
        st.markdown(f'<div class="gradient-text">{t["nav_report"]}</div>', unsafe_allow_html=True)
        st.markdown(f'<div class="gradient-subtitle">{t["rep_download_btn"].replace("📥 ", "")}</div>', unsafe_allow_html=True)
    else:
        st.markdown(f'<div class="gradient-text">{t["nav_analysis"]}</div>', unsafe_allow_html=True)
        st.markdown(f'<div class="gradient-subtitle">{t["dash_subtitle"]}</div>', unsafe_allow_html=True)

    processed_dir = normalize_path(PROCESSED_DIR)
    all_data = load_data(processed_dir)

    if not all_data:
        st.info("No processed reports found. Process some PDFs first.")
        return

    tickers = sorted(set(d["ticker"] for d in all_data if d.get("ticker")))
    if not tickers:
        st.warning("No stocks found.")
        return

    selected_ticker = st.selectbox("Select Stock", tickers, key="stock_selector")
    stock_data = [d for d in all_data if d.get("ticker") == selected_ticker]

    if not stock_data:
        return

    company = stock_data[0].get("company", selected_ticker)

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
    broker_comp = analyzer.broker_comparison(ratings)
    trends = analyzer.trend_analysis(ratings)

    if full_report:
        report_text = consensus_agent.generate_report(
            selected_ticker, company,
            {
                "consensus_rating": consensus_agent._determine_consensus_rating(
                    consensus.get("rating_distribution", {})
                ),
                "target_price": consensus,
                "sentiment": sentiment,
                "themes": themes,
                "broker_comparison": broker_comp,
                "trends": trends,
                "upside_potential": 0,
            },
            stock_data
        )
        st.markdown(report_text)

        if st.button(t["rep_download_btn"]):
            report_path = normalize_path(REPORTS_DIR) / f"{selected_ticker}_report.md"
            report_path.write_text(report_text, encoding="utf-8")
            st.success(t["rep_download_success"].format(report_path))
    else:
        st.markdown(f'<h3 style="color: #00F0FF; font-weight: 700; margin-top: 20px; margin-bottom: 15px;">{company} ({selected_ticker})</h3>', unsafe_allow_html=True)

        kpi_cols = st.columns(4)
        consensus_rating = consensus_agent._determine_consensus_rating(consensus.get("rating_distribution", {}))
        rating_display = t[f"rating_{consensus_rating.lower()}"] if f"rating_{consensus_rating.lower()}" in t else consensus_rating
        rating_color = "#00cc96" if consensus_rating == "BUY" else ("#ffa15a" if consensus_rating == "HOLD" else "#ef553b")
        
        with kpi_cols[0]:
            kpi_card_html(t["card_consensus"], rating_display, t["card_consensus_desc"], rating_color)
        with kpi_cols[1]:
            kpi_card_html(t["card_avg_target"], f"{consensus['avg_target_price']:,.0f}", f"Median / 中位數: {consensus.get('median_target_price', 0):,.0f}", "#00D2FF")
        with kpi_cols[2]:
            kpi_card_html(t["card_sentiment"], f"{sentiment['bullish']}%", t["card_sentiment_desc"].format(sentiment['bearish']), "#00cc96" if sentiment['bullish'] > 50 else "#ffa15a")
        with kpi_cols[3]:
            kpi_card_html(t["card_reports"], str(consensus["total_reports"]), t["card_reports_desc"], "#7928CA")

        st.divider()

        tab1, tab2, tab3, tab4 = st.tabs(
            [t["section_broker_comp"], t["section_bull_bear"], t["anal_target"], t["anal_trend_title"]]
        )

        with tab1:
            st.subheader(t["section_broker_comp"])
            if broker_comp:
                df = pd.DataFrame(broker_comp)
                df["target_price_display"] = df["target_price"].apply(
                    lambda x: f"{x:,.0f}" if x else "N/A"
                )
                # Translate rating column for display
                df_display = df.copy()
                df_display["rating"] = df_display["rating"].apply(
                    lambda r: t[f"rating_{r.lower()}"] if f"rating_{r.lower()}" in t else r
                )
                st.dataframe(
                    df_display[["broker", "rating", "target_price_display", "latest_date"]],
                    column_config={
                        "broker": t["anal_broker"],
                        "rating": t["anal_rating"],
                        "target_price_display": t["anal_target"],
                        "latest_date": t["anal_date"],
                    },
                    hide_index=True,
                    use_container_width=True,
                )

                fig = px.bar(
                    df, x="broker", y="target_price", color="rating",
                    color_discrete_map={
                        "BUY": "#00cc96", "HOLD": "#ffa15a", "SELL": "#ef553b"
                    },
                    title="Target Price by Broker"
                )
                st.plotly_chart(apply_plotly_theme(fig), use_container_width=True)

        with tab2:
            col1, col2 = st.columns(2)
            with col1:
                st.markdown(f"### {t['anal_bull_arguments']}")
                for d in stock_data:
                    for bp in d.get("bull_points", []):
                        st.markdown(f"- ✅ {bp}")
            with col2:
                st.markdown(f"### {t['anal_bear_arguments']}")
                for d in stock_data:
                    for bp in d.get("bear_points", []):
                        st.markdown(f"- ⚠️ {bp}")

            st.divider()
            theme_col1, theme_col2 = st.columns(2)
            with theme_col1:
                st.markdown(f"**{t['section_bull_themes']}**")
                if themes["bull_themes"]:
                    bull_df = pd.DataFrame(
                        list(themes["bull_themes"].items()),
                        columns=["Theme", "Count"]
                    ).sort_values("Count")
                    fig = px.bar(bull_df, x="Count", y="Theme",
                                 orientation="h", color_discrete_sequence=["#00cc96"])
                    st.plotly_chart(apply_plotly_theme(fig), use_container_width=True)
            with theme_col2:
                st.markdown(f"**{t['section_bear_themes']}**")
                if themes["bear_themes"]:
                    bear_df = pd.DataFrame(
                        list(themes["bear_themes"].items()),
                        columns=["Theme", "Count"]
                    ).sort_values("Count")
                    fig = px.bar(bear_df, x="Count", y="Theme",
                                 orientation="h", color_discrete_sequence=["#ef553b"])
                    st.plotly_chart(apply_plotly_theme(fig), use_container_width=True)

        with tab3:
            st.subheader(t["anal_dist_title"])
            prices = [r["target_price"] for r in ratings if r.get("target_price", 0) > 0]
            if prices:
                fig = px.histogram(
                    prices, nbins=10,
                    title=t["anal_dist_title"],
                    labels={"value": t["anal_target"], "count": "Count"},
                    color_discrete_sequence=["#00F0FF"]
                )
                fig.add_vline(x=sum(prices)/len(prices), line_dash="dash",
                              line_color="#FF4B4B", annotation_text=f"{t['anal_dist_avg']}: {sum(prices)/len(prices):,.0f}")
                st.plotly_chart(apply_plotly_theme(fig), use_container_width=True)

                st.markdown(
                    t["anal_dist_stats"].format(
                        min_p=min(prices), max_p=max(prices),
                        avg_p=sum(prices)/len(prices), med_p=sorted(prices)[len(prices)//2]
                    )
                )

        with tab4:
            st.subheader(t["anal_trend_title"])
            if trends["price_trend"]:
                trend_df = pd.DataFrame(trends["price_trend"])
                fig = px.line(
                    trend_df, x="date", y="target_price", color="broker",
                    markers=True, title=t["anal_trend_title"]
                )
                st.plotly_chart(apply_plotly_theme(fig), use_container_width=True)

                st.markdown(
                    t["anal_trend_stats"].format(
                        up=trends['upgrades'], down=trends['downgrades'], total=trends['total_target_changes']
                    )
                )


def load_data(processed_dir: Path) -> list[dict]:
    data = []
    for f in processed_dir.glob("*.json"):
        try:
            d = json.loads(f.read_text(encoding="utf-8"))
            data.append(d)
        except (json.JSONDecodeError, Exception):
            continue
    return data
