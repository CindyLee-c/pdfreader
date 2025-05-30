# cleaner.py
import re
from PyPDF2 import PdfReader # [cite: 5] PyPDF2 is listed as a requirement
from urllib.parse import urlparse

def remove_urls_with_parser(text):
    words = text.split()
    filtered_words = []
    for word in words:
        parsed = urlparse(word)
        if not parsed.scheme and not parsed.netloc: #
            filtered_words.append(word)
    return ' '.join(filtered_words)

def clean_pdf_text(text: str) -> str:
    text = remove_urls_with_parser(text) #
    text = re.sub(r'^\s*\d+\s*$', '', text, flags=re.MULTILINE) #
    text = re.sub(r'(?i)(isbn|©|copyright)[^\n]*', '', text) #
    text = re.sub(r'^[A-Z\s]{5,}$', '', text, flags=re.MULTILINE) #
    text = re.sub(r'-\n', '', text) #
    text = re.sub(r'\n{2,}', '\n\n', text) #
    text = re.sub(r'[•–—•*]+', '', text) #
    text = re.sub(r'\.{3,}', '.', text) #
    return text.strip()

def extract_and_clean_pdf_text(pdf_path: str, start_page: int = 0) -> str:
    try:
        reader = PdfReader(pdf_path) #
        raw_text = ""
        # Process from the specified start_page (0-indexed) to the end
        # Original code skipped the first page: for page in reader.pages[1:]:
        # Now, it processes from start_page (defaulting to 0, the first page)
        if start_page < 0 or start_page >= len(reader.pages):
            # Handle invalid start_page, perhaps return empty or raise error
            # For now, let's default to all pages if start_page is out of bounds for simplicity here
            # Or, rely on PdfReader to handle page indexing errors if appropriate for your design
             for page_num in range(len(reader.pages)): # Process all pages if start_page is invalid for safety
                raw_text += reader.pages[page_num].extract_text() or ""
        else:
            for i in range(start_page, len(reader.pages)):
                raw_text += reader.pages[i].extract_text() or ""
        
        return clean_pdf_text(raw_text)
    except Exception as e: # Catching a broader range of PyPDF2 errors including potential decryption issues if password protected
        print(f"Error reading PDF {pdf_path}: {e}") # Log for server-side diagnostics
        raise ValueError(f"Could not read PDF: {os.path.basename(pdf_path)}. It might be corrupted or protected.") from e