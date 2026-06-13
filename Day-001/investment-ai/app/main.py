import sys
from pathlib import Path
import streamlit as st

# Ensure the project root is in the Python path
sys.path.append(str(Path(__file__).resolve().parent.parent))
st.set_page_config(
    page_title="Investment Research Intelligence",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="expanded",
)

from app.dashboard import show_dashboard
from app.report_viewer import show_report
from app.chat import show_chat
from app.style import inject_custom_css
from app.translations import TRANSLATIONS


def main():
    # Inject premium styles
    inject_custom_css()
    
    # Language selector
    lang = st.sidebar.selectbox(
        "Language / 語言",
        ["繁體中文", "English"],
        index=0,
        key="lang_selector"
    )
    st.session_state.language = lang
    t = TRANSLATIONS[lang]
    
    st.sidebar.markdown('<div class="gradient-text" style="font-size: 1.5rem; margin-top: 15px; margin-bottom: 15px;">INVESTMENT AI</div>', unsafe_allow_html=True)
    st.sidebar.markdown("---")

    pages = [t["nav_dashboard"], t["nav_analysis"], t["nav_report"], t["nav_chat"]]
    page = st.sidebar.radio(
        t["nav_title"],
        pages,
        index=0,
    )

    st.sidebar.markdown("---")
    st.sidebar.markdown(f'<div style="font-weight: 600; color: #00F0FF; margin-bottom: 5px;">{t["sidebar_info_title"]}</div>', unsafe_allow_html=True)
    st.sidebar.markdown(f'<div style="font-size: 0.85rem; color: #8F9CAE;">{t["sidebar_info_desc"]}</div>', unsafe_allow_html=True)

    if page == t["nav_dashboard"]:
        show_dashboard()
    elif page == t["nav_analysis"]:
        show_report()
    elif page == t["nav_report"]:
        show_report(full_report=True)
    elif page == t["nav_chat"]:
        show_chat()


if __name__ == "__main__":
    main()
