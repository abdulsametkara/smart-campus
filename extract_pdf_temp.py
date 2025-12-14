
import sys
import os

try:
    from pypdf import PdfReader
except ImportError:
    try:
        from PyPDF2 import PdfReader
    except ImportError:
        print("MISSING_LIB")
        sys.exit(0)

try:
    reader = PdfReader("FINAL_PROJECT_ASSIGNMENT.pdf")
    text = ""
    for i, page in enumerate(reader.pages):
        text += f"\n--- Page {i+1} ---\n"
        text += page.extract_text() + "\n"
    
    with open("pdf_content.txt", "w", encoding="utf-8") as f:
        f.write(text)
    print("PDF content saved to pdf_content.txt")
except Exception as e:
    print(f"Error reading PDF: {e}")
