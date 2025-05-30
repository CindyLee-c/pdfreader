from flask import Flask, render_template, request, jsonify #
import os
from cleaner import extract_and_clean_pdf_text #
from PyPDF2 import PdfReader # For page count and specific PyPDF2 errors

app = Flask(__name__) #
UPLOAD_FOLDER = 'uploads' #
os.makedirs(UPLOAD_FOLDER, exist_ok=True) #

# Store current PDF path and total pages for jump functionality if desired (can also pass filename and re-open)
# For simplicity, this example assumes the file remains in uploads and we re-process
# A more robust solution might involve sessions or more persistent storage of PDF info

@app.route('/', methods=['GET', 'POST'])
def index():
    return render_template('index.html', cleaned_text='') #

@app.route('/upload', methods=['POST'])
def upload_pdf():
    if 'pdf' not in request.files:
        return jsonify({'error': 'No file part in the request.'}), 400 # modified error message
    file = request.files['pdf']
    if file.filename == '':
        return jsonify({'error': 'No file selected.'}), 400 # modified error message
    
    if file:
        filepath = os.path.join(UPLOAD_FOLDER, file.filename) #
        file.save(filepath) #
        
        try:
            # Get chunk size from request, default to 3
            chunk_size = int(request.form.get('chunk_size', 3))
            if chunk_size <= 0: # Basic validation for chunk_size
                chunk_size = 3

            # Check total pages for later use if needed (e.g. validating jump page number)
            pdf_reader_for_pages = PdfReader(filepath)
            total_pages = len(pdf_reader_for_pages.pages)

            cleaned_text = extract_and_clean_pdf_text(filepath) #
            words = cleaned_text.split() #
            chunks = [' '.join(words[i:i+chunk_size]) for i in range(0, len(words), chunk_size)] #
            return jsonify({'chunks': chunks, 'filename': file.filename, 'total_pages': total_pages})
        except ValueError as ve: # Catch specific error from extract_and_clean_pdf_text
            return jsonify({'error': str(ve)}), 400
        except Exception as e:
            # Catch other potential errors during processing
            return jsonify({'error': f'Error processing PDF: {str(e)}'}), 500
            
    return jsonify({'error': 'An unknown error occurred.'}), 500 # modified error message

@app.route('/jump', methods=['POST'])
def jump_to_page_route():
    data = request.get_json()
    filename = data.get('filename')
    page_num_str = data.get('page_number')
    chunk_size_str = data.get('chunk_size', '3') # Default chunk size

    if not filename or not page_num_str:
        return jsonify({'error': 'Filename and page number are required.'}), 400

    try:
        page_num = int(page_num_str)
        chunk_size = int(chunk_size_str)
        if chunk_size <= 0:
            chunk_size = 3
    except ValueError:
        return jsonify({'error': 'Page number and chunk size must be integers.'}), 400

    filepath = os.path.join(UPLOAD_FOLDER, filename)
    if not os.path.exists(filepath):
        return jsonify({'error': 'PDF file not found. Please upload again.'}), 404

    try:
        # Page numbers are typically 1-indexed for users, convert to 0-indexed for PyPDF2
        start_page_index = page_num - 1 
        
        # Validate page number against total pages
        pdf_reader_for_validation = PdfReader(filepath)
        total_pages = len(pdf_reader_for_validation.pages)
        if not (0 <= start_page_index < total_pages):
            return jsonify({'error': f'Invalid page number. Must be between 1 and {total_pages}.'}), 400

        cleaned_text = extract_and_clean_pdf_text(filepath, start_page=start_page_index)
        words = cleaned_text.split()
        chunks = [' '.join(words[i:i+chunk_size]) for i in range(0, len(words), chunk_size)]
        return jsonify({'chunks': chunks, 'current_page_text_sample': ' '.join(words[:50])}) # Optionally send a sample
    except ValueError as ve: # Catch specific error from extract_and_clean_pdf_text
            return jsonify({'error': str(ve)}), 400
    except Exception as e:
        return jsonify({'error': f'Error processing PDF from page {page_num}: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True, use_reloader=False) #