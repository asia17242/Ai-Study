import streamlit as st
import plotly.graph_objects as go
import plotly.express as px

def inject_custom_css():
    """Inject premium CSS styles for glassmorphism, typography, and clean UI components."""
    css = """
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    
    <style>
        /* Base typography */
        html, body, [class*="css"], .stApp {
            font-family: 'Outfit', sans-serif !important;
            background-color: #080B11 !important;
            color: #F5F6F9 !important;
        }

        /* Sidebar Styling */
        section[data-testid="stSidebar"] {
            background-color: #0B0F19 !important;
            border-right: 1px solid rgba(255, 255, 255, 0.05);
            width: 280px !important;
        }
        
        section[data-testid="stSidebar"] .stRadio > label {
            font-weight: 600 !important;
            font-size: 1.1rem !important;
            color: #00F0FF !important;
        }

        /* Custom Card Styles (Glassmorphism) */
        .glass-card {
            background: rgba(255, 255, 255, 0.02) !important;
            border-radius: 16px !important;
            border: 1px solid rgba(255, 255, 255, 0.08) !important;
            padding: 24px !important;
            box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3) !important;
            backdrop-filter: blur(8px) !important;
            -webkit-backdrop-filter: blur(8px) !important;
            transition: all 0.3s ease !important;
            margin-bottom: 20px !important;
        }
        
        .glass-card:hover {
            transform: translateY(-2px) !important;
            border: 1px solid rgba(0, 240, 255, 0.3) !important;
            box-shadow: 0 8px 32px 0 rgba(0, 240, 255, 0.1) !important;
        }

        /* Button Styling */
        div.stButton > button {
            background: linear-gradient(135deg, #0072FF 0%, #00F0FF 100%) !important;
            color: white !important;
            border: none !important;
            padding: 10px 24px !important;
            font-weight: 600 !important;
            border-radius: 10px !important;
            box-shadow: 0 4px 15px rgba(0, 240, 255, 0.2) !important;
            transition: all 0.3s ease !important;
            width: 100% !important;
        }

        div.stButton > button:hover {
            transform: translateY(-1px) !important;
            box-shadow: 0 6px 20px rgba(0, 240, 255, 0.4) !important;
            background: linear-gradient(135deg, #00C6FF 0%, #0072FF 100%) !important;
        }
        
        div.stButton > button:active {
            transform: translateY(1px) !important;
        }

        /* Header Gradient Text */
        .gradient-text {
            background: linear-gradient(135deg, #00F0FF 0%, #7928CA 100%) !important;
            -webkit-background-clip: text !important;
            -webkit-text-fill-color: transparent !important;
            font-weight: 800 !important;
            font-size: 2.5rem !important;
            margin-bottom: 0.5rem !important;
        }

        .gradient-subtitle {
            color: #8F9CAE !important;
            font-size: 1.1rem !important;
            font-weight: 400 !important;
            margin-bottom: 2rem !important;
        }

        /* Tabs styling */
        .stTabs [data-baseweb="tab-list"] {
            gap: 10px !important;
            background-color: transparent !important;
        }

        .stTabs [data-baseweb="tab"] {
            height: 45px !important;
            background-color: rgba(255, 255, 255, 0.02) !important;
            border: 1px solid rgba(255, 255, 255, 0.05) !important;
            border-radius: 8px 8px 0px 0px !important;
            padding: 10px 20px !important;
            color: #8F9CAE !important;
            font-weight: 500 !important;
            transition: all 0.2s ease !important;
        }

        .stTabs [aria-selected="true"] {
            background-color: rgba(0, 240, 255, 0.08) !important;
            border-bottom: 2px solid #00F0FF !important;
            color: #00F0FF !important;
        }

        /* Tables and Dataframes */
        [data-testid="stTable"] table {
            border-radius: 12px !important;
            overflow: hidden !important;
            border: 1px solid rgba(255, 255, 255, 0.08) !important;
        }

        [data-testid="stTable"] th {
            background-color: #101622 !important;
            color: #00F0FF !important;
            font-weight: 600 !important;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
        }
        
        [data-testid="stTable"] td {
            background-color: rgba(255, 255, 255, 0.01) !important;
            border-bottom: 1px solid rgba(255, 255, 255, 0.04) !important;
        }

        /* Metric custom styling override */
        [data-testid="metric-container"] {
            background: rgba(255, 255, 255, 0.02) !important;
            border: 1px solid rgba(255, 255, 255, 0.06) !important;
            border-radius: 12px !important;
            padding: 15px !important;
        }
        
        [data-testid="metric-container"] label {
            color: #8F9CAE !important;
            font-weight: 500 !important;
        }
        
        [data-testid="metric-container"] div[data-testid="stMetricValue"] {
            color: #ffffff !important;
            font-size: 1.8rem !important;
            font-weight: 700 !important;
        }

        /* Scrollbar styling */
        ::-webkit-scrollbar {
            width: 8px !important;
            height: 8px !important;
        }
        ::-webkit-scrollbar-track {
            background: #080B11 !important;
        }
        ::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.1) !important;
            border-radius: 4px !important;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: rgba(0, 240, 255, 0.3) !important;
        }
    </style>
    """
    st.markdown(css, unsafe_allow_html=True)


def kpi_card_html(label: str, value: str, subtitle: str = None, color: str = "#00F0FF"):
    """Generate a custom glassmorphic KPI card."""
    sub_html = f'<div style="font-size: 0.85rem; color: #8F9CAE; margin-top: 4px;">{subtitle}</div>' if subtitle else ""
    card_html = f"""
    <div style="
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-left: 4px solid {color};
        border-radius: 12px;
        padding: 16px 20px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        backdrop-filter: blur(10px);
        margin-bottom: 12px;
    ">
        <div style="font-size: 0.9rem; font-weight: 600; color: #8F9CAE; text-transform: uppercase; letter-spacing: 0.5px;">{label}</div>
        <div style="font-size: 1.8rem; font-weight: 700; color: #FFFFFF; margin-top: 6px; line-height: 1.2;">{value}</div>
        {sub_html}
    </div>
    """
    return st.markdown(card_html, unsafe_allow_html=True)


def apply_plotly_theme(fig):
    """Format Plotly charts to look sleek, dark, and match the custom color scheme."""
    fig.update_layout(
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        font=dict(family="Outfit, sans-serif", color="#F5F6F9"),
        title=dict(font=dict(size=16, color="#00F0FF", weight="bold")),
        margin=dict(t=50, b=30, l=30, r=30),
    )
    
    # Update gridlines and axes for cartesian charts
    if hasattr(fig, 'layout') and fig.layout.xaxis:
        fig.update_xaxes(
            showgrid=True,
            gridcolor='rgba(255, 255, 255, 0.05)',
            linecolor='rgba(255, 255, 255, 0.1)',
            zeroline=False
        )
    if hasattr(fig, 'layout') and fig.layout.yaxis:
        fig.update_yaxes(
            showgrid=True,
            gridcolor='rgba(255, 255, 255, 0.05)',
            linecolor='rgba(255, 255, 255, 0.1)',
            zeroline=False
        )
    return fig
