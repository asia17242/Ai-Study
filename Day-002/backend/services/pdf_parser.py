import os
from pypdf import PdfReader

class PDFParser:
    @staticmethod
    def parse_pdf(file_path: str) -> dict:
        """
        Parses a PDF file and extracts its text and page count.
        
        Args:
            file_path (str): The absolute path to the PDF file.
            
        Returns:
            dict: A dictionary containing:
                - "pages" (int): Number of pages in the PDF.
                - "text" (str): Extracted text content from the PDF.
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"PDF file not found at {file_path}")
            
        try:
            reader = PdfReader(file_path)
            total_pages = len(reader.pages)
            extracted_text = []
            
            for page_num in range(total_pages):
                page = reader.pages[page_num]
                text = page.extract_text()
                if text:
                    extracted_text.append(text)
            
            full_text = "\n\n".join(extracted_text)
            
            # Fallback if text extraction yields nothing (e.g. image-only PDF)
            if not full_text.strip():
                full_text = f"[Image-only PDF parsed. Pages: {total_pages}]"
                
            return {
                "pages": total_pages,
                "text": full_text
            }
        except Exception as e:
            # Raise descriptive error
            raise ValueError(f"Failed to parse PDF: {str(e)}")
