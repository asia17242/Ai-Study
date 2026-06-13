import sys
from pathlib import Path
import json

# Ensure project root is in path
sys.path.append(str(Path(__file__).resolve().parent))

from config.settings import RAW_PDFS_DIR, PROCESSED_DIR
from agents.metadata_agent import MetadataAgent
from agents.financial_agent import FinancialAgent
from core.normalizer import Normalizer

print("RAW_PDFS_DIR:", RAW_PDFS_DIR)
print("PROCESSED_DIR:", PROCESSED_DIR)

# List files
raw_dir = Path(RAW_PDFS_DIR)
all_files = list(raw_dir.glob("*"))
print("All files in raw_pdfs:", [f.name for f in all_files])

pdf_files = list(raw_dir.glob("*.pdf")) + list(raw_dir.glob("*.PDF"))
# Unique files
pdf_files = list(set(pdf_files))
print("PDF files found:", [f.name for f in pdf_files])

metadata_agent = MetadataAgent()
financial_agent = FinancialAgent()

for pdf_path in pdf_files:
    print(f"\nProcessing {pdf_path.name}...")
    try:
        result = metadata_agent.process(str(pdf_path))
        print("Success metadata extraction:")
        print("  Ticker:", result["stock_info"]["ticker"])
        print("  Company:", result["stock_info"]["company"])
        print("  Broker:", result["stock_info"]["broker"])
        print("  Target price:", result["rating_info"]["target_price"])
        print("  Rating standard:", result["rating_info"]["rating_standard"])
        
        # Financial metrics
        financial_metrics = financial_agent.extract_metrics("", result)
        print("  Financial metrics count:", len(financial_metrics))
        
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
            "file_hash": result["pdf_metadata"]["file_hash"],
            "pages": result["pdf_metadata"]["pages"],
            "financial_metrics": financial_metrics,
        }
        
        output_path = Path(PROCESSED_DIR) / f"{pdf_path.stem}_processed.json"
        output_path.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"  Saved to {output_path.name}")
        
    except Exception as e:
        print(f"  Failed: {e}")
        import traceback
        traceback.print_exc()
