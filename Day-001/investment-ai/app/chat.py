import json
from pathlib import Path

import streamlit as st

from config.settings import PROCESSED_DIR, OPENAI_API_KEY, OPENAI_MODEL
from core.analyzer import Analyzer
from agents.consensus_agent import ConsensusAgent
from app.translations import TRANSLATIONS


def normalize_path(p):
    return Path(str(p))


def show_chat():
    lang = st.session_state.get("language", "繁體中文")
    t = TRANSLATIONS[lang]

    st.markdown(f'<div class="gradient-text">{t["nav_chat"]}</div>', unsafe_allow_html=True)
    st.markdown(f'<div class="gradient-subtitle">{t["chat_placeholder"].replace("...", "")}</div>', unsafe_allow_html=True)

    processed_dir = normalize_path(PROCESSED_DIR)
    all_data = load_data(processed_dir)

    if not all_data:
        st.info(t["dash_no_data"])
        return

    if "messages" not in st.session_state:
        st.session_state.messages = [
            {"role": "assistant", "content": t["chat_welcome"]}
        ]

    for message in st.session_state.messages:
        with st.chat_message(message["role"]):
            st.markdown(message["content"])

    if prompt := st.chat_input(t["chat_placeholder"]):
        st.session_state.messages.append({"role": "user", "content": prompt})
        with st.chat_message("user"):
            st.markdown(prompt)

        with st.chat_message("assistant"):
            with st.spinner(t["chat_analyzing"]):
                response = answer_question(prompt, all_data, lang)
                st.markdown(response)

        st.session_state.messages.append({"role": "assistant", "content": response})


def answer_question(query: str, all_data: list[dict], lang: str = "繁體中文") -> str:
    query_lower = query.lower()
    analyzer = Analyzer()
    consensus_agent = ConsensusAgent()
    t = TRANSLATIONS[lang]

    ticker = extract_ticker(query, all_data)
    if ticker:
        stock_data = [d for d in all_data if d.get("ticker") == ticker]
    else:
        stock_data = all_data

    if not stock_data:
        return t["chat_no_data"]

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

    if any(kw in query_lower for kw in ["consensus", "overall", "summary", "market", "共識", "市場", "總體"]):
        consensus = analyzer.consensus_analysis(ratings)
        sentiment = analyzer.sentiment_score(bull_bear)
        company = stock_data[0].get("company", ticker or "all stocks")
        return format_consensus_answer(company, ticker, consensus, sentiment, lang)

    if any(kw in query_lower for kw in ["bullish", "most bullish", "highest", "看多", "最高", "樂觀"]):
        if ratings:
            sorted_ratings = sorted(
                ratings, key=lambda r: r.get("target_price", 0), reverse=True
            )
            top = sorted_ratings[0]
            rating_display = t[f"rating_{top['rating_standard'].lower()}"] if f"rating_{top['rating_standard'].lower()}" in t else top['rating_standard']
            return t["chat_most_bullish"].format(
                company=stock_data[0].get('company', ticker),
                broker=top['broker'],
                price=top['target_price'],
                rating=rating_display
            )
        return t["chat_no_rating"]

    if any(kw in query_lower for kw in ["most bearish", "lowest", "least bullish", "看空", "最低", "保守"]):
        if ratings:
            sorted_ratings = sorted(
                ratings, key=lambda r: r.get("target_price", 0)
            )
            bottom = sorted_ratings[0]
            rating_display = t[f"rating_{bottom['rating_standard'].lower()}"] if f"rating_{bottom['rating_standard'].lower()}" in t else bottom['rating_standard']
            return t["chat_most_bearish"].format(
                company=stock_data[0].get('company', ticker),
                broker=bottom['broker'],
                price=bottom['target_price'],
                rating=rating_display
            )
        return t["chat_no_rating"]

    if any(kw in query_lower for kw in ["bull", "bear", "argument", "thesis", "論點", "看法", "好壞"]):
        bulls = [d for d in stock_data for bp in d.get("bull_points", [])]
        bears = [d for d in stock_data for bp in d.get("bear_points", [])]
        response = t["chat_bull_header"]
        for d in stock_data:
            for bp in d.get("bull_points", []):
                response += f"- {bp}\n"
        response += t["chat_bear_header"]
        for d in stock_data:
            for bp in d.get("bear_points", []):
                response += f"- {bp}\n"
        if response.strip() == t["chat_bull_header"].strip() + "\n\n" + t["chat_bear_header"].strip():
            return t["chat_no_bull_bear"]
        return response

    if any(kw in query_lower for kw in ["trend", "history", "change", "upgrade", "downgrade", "趨勢", "歷史", "變化"]):
        trends = analyzer.trend_analysis(ratings)
        response = t["chat_trend_header"].format(
            up=trends['upgrades'], down=trends['downgrades'], total=trends['total_target_changes']
        )
        for t_item in trends["price_trend"][-5:]:
            rating_display = t[f"rating_{t_item['rating'].lower()}"] if f"rating_{t_item['rating'].lower()}" in t else t_item['rating']
            response += f"- {t_item['date']}: {t_item['broker']} @ {t_item['target_price']:,.0f} ({rating_display})\n"
        return response

    if any(kw in query_lower for kw in ["compare", "vs", "versus", "difference", "比較", "對比"]):
        tickers_in_query = [
            word.upper()
            for word in query.split()
            if word.isdigit() and len(word) == 4
        ]
        if len(tickers_in_query) >= 2:
            t1_data = [d for d in all_data if d.get("ticker") == tickers_in_query[0]]
            t2_data = [d for d in all_data if d.get("ticker") == tickers_in_query[1]]
            if t1_data and t2_data:
                r1 = analyzer.consensus_analysis([
                    {"target_price": d.get("target_price", 0), "rating_standard": d.get("rating_standard", "")}
                    for d in t1_data
                ])
                r2 = analyzer.consensus_analysis([
                    {"target_price": d.get("target_price", 0), "rating_standard": d.get("rating_standard", "")}
                    for d in t2_data
                ])
                return t["chat_compare_header"].format(
                    t1=tickers_in_query[0], t2=tickers_in_query[1],
                    avg1=r1['avg_target_price'], count1=r1['total_reports'],
                    avg2=r2['avg_target_price'], count2=r2['total_reports']
                )

    if any(kw in query_lower for kw in ["broker", "analyst", "who", "券商", "覆蓋"]):
        if ratings:
            broker_list = list(set(r["broker"] for r in ratings if r.get("broker")))
            return t["chat_broker_list"] + "\n".join(f"- {b}" for b in broker_list)
        return t["chat_no_rating"]

    company = stock_data[0].get("company", ticker or "the stock")
    consensus = analyzer.consensus_analysis(ratings)
    sentiment = analyzer.sentiment_score(bull_bear)
    themes = analyzer.bull_bear_themes(bull_bear)

    consensus_rating = consensus_agent._determine_consensus_rating(consensus.get('rating_distribution', {}))
    rating_display = t[f"rating_{consensus_rating.lower()}"] if f"rating_{consensus_rating.lower()}" in t else consensus_rating
    
    response = f"### {company}\n\n"
    response += f"**{t['card_consensus']}**: {rating_display}\n"
    response += f"**{t['card_avg_target']}**: {consensus['avg_target_price']:,.0f}\n"
    response += f"**{t['card_reports']}**: {consensus['total_reports']}\n\n"
    
    bull_themes_str = ", ".join(list(themes["bull_themes"].keys())[:3]) if themes["bull_themes"] else t["no_bull_themes"]
    bear_themes_str = ", ".join(list(themes["bear_themes"].keys())[:3]) if themes["bear_themes"] else t["no_bear_themes"]
    
    response += f"**{t['section_bull_themes']}**: " + bull_themes_str + "\n"
    response += f"**{t['section_bear_themes']}**: " + bear_themes_str
    return response


def extract_ticker(query: str, all_data: list[dict]) -> str | None:
    words = query.split()
    for word in words:
        clean = word.strip(".,!?")
        if clean.isdigit() and len(clean) == 4:
            return clean

    known_tickers = set(d.get("ticker", "") for d in all_data if d.get("ticker"))
    for t in known_tickers:
        if t.lower() in query.lower():
            return t

    company_map = {}
    for d in all_data:
        if d.get("company") and d.get("ticker"):
            company_map[d["company"].lower()] = d["ticker"]
    for name, t in company_map.items():
        if name in query.lower():
            return t

    name_to_ticker = {
        "tsmc": "2330", "taiwan semiconductor": "2330", "mediatek": "2454",
        "mtk": "2454", "hon hai": "2317", "foxconn": "2317",
        "quanta": "2382", "hlnc": "2379",
    }
    query_lower = query.lower()
    for name, t in name_to_ticker.items():
        if name in query_lower:
            return t

    return None


def format_consensus_answer(company: str, ticker: str | None, consensus: dict, sentiment: dict, lang: str = "繁體中文") -> str:
    t = TRANSLATIONS[lang]
    ticker_str = f" ({ticker})" if ticker else ""
    consensus_rating = "BUY"
    # Find rating display
    rating_display = t[f"rating_{consensus_rating.lower()}"] if f"rating_{consensus_rating.lower()}" in t else consensus_rating
    
    rating_breakdown = ""
    for rating, count in consensus.get("rating_distribution", {}).items():
        rating_lbl = t[f"rating_{rating.lower()}"] if f"rating_{rating.lower()}" in t else rating
        rating_breakdown += f"- {rating_lbl}: {count}\n"
        
    return (
        f"### {t['section_broker_comp']} - {company}{ticker_str}\n\n"
        f"- **{t['card_consensus']}**: {rating_display}\n"
        f"- **{t['card_avg_target']}**: {consensus['avg_target_price']:,.0f}\n"
        f"- **{t['card_avg_target_range'].split(':')[0]}**: {consensus['low_target_price']:,.0f} - {consensus['high_target_price']:,.0f}\n"
        f"- **{t['card_reports']}**: {consensus['total_reports']}\n\n"
        f"### {t['section_sentiment_breakdown']}\n"
        f"- Bullish / 看多: {sentiment['bullish']}%\n"
        f"- Neutral / 中立: {sentiment['neutral']}%\n"
        f"- Bearish / 看空: {sentiment['bearish']}%\n\n"
        f"### {t['section_rating_dist']}\n" + rating_breakdown
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
