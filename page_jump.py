
from PyPDF2 import PdfReader

def jump_to_page(pdf_path, page_number):
    reader = PdfReader(pdf_path)
    if page_number < 1 or page_number > len(reader.pages):
        return "Ongeldige paginanummer"
    content = reader.pages[page_number - 1].extract_text()
    return content or "(Geen tekst op deze pagina)"

if __name__ == "__main__":
    path = "uploads/test.pdf"  # vervang dit met je testbestand
    page = 2
    print(jump_to_page(path, page))
