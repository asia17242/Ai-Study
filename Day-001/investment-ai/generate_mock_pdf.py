from fpdf import FPDF
import os

os.makedirs("data/raw_pdfs", exist_ok=True)

# Generate 2330_Goldman.pdf
pdf1 = FPDF()
pdf1.add_page()
pdf1.set_font("Arial", size=12)
text1 = """
TSMC (2330) Investment Research Report
Broker: Goldman Sachs
Date: 2026-06-12

Rating: BUY
Target Price: NT$ 1500

Summary:
TSMC continues to see strong demand from AI applications.

Bull Points:
- Strong AI demand and CoWoS expansion.
- Advanced nodes (3nm, 2nm) leadership.

Bear Points:
- Geopolitical risk remains a concern.
- Higher CapEx pressure.
"""
for line in text1.split('\n'):
    pdf1.cell(200, 10, txt=line.encode('latin-1', 'replace').decode('latin-1'), ln=True)
pdf1.output("data/raw_pdfs/2330_Goldman.pdf")

# Generate 2454_Morgan.pdf
pdf2 = FPDF()
pdf2.add_page()
pdf2.set_font("Arial", size=12)
text2 = """
MediaTek (2454) Investment Research Report
Broker: Morgan Stanley
Date: 2026-06-12

Rating: HOLD
Target Price: NT$ 1200

Summary:
MediaTek faces mixed demand in the smartphone market.

Bull Points:
- Edge AI integration in mobile devices.
- Market share gains in flagship segment.

Bear Points:
- Competition from Qualcomm.
- Macro uncertainty weighing on smartphone sales.
"""
for line in text2.split('\n'):
    pdf2.cell(200, 10, txt=line.encode('latin-1', 'replace').decode('latin-1'), ln=True)
pdf2.output("data/raw_pdfs/2454_Morgan.pdf")

# Generate 2330_Citi.pdf
pdf3 = FPDF()
pdf3.add_page()
pdf3.set_font("Arial", size=12)
text3 = """
Taiwan Semiconductor (2330) Update
Broker: Citi
Date: 2026-06-12

Rating: BUY
Target Price: NT$ 1520

Summary:
We raise our target price on TSMC given solid N3 execution.

Bull Points:
- AI demand accelerating.
- Market share gains in advanced nodes.

Bear Points:
- Macro uncertainty.
"""
for line in text3.split('\n'):
    pdf3.cell(200, 10, txt=line.encode('latin-1', 'replace').decode('latin-1'), ln=True)
pdf3.output("data/raw_pdfs/2330_Citi.pdf")

print("Generated 3 mock PDFs in data/raw_pdfs/")
