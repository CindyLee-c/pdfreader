// script.js
let chunks = []; //
let index = 0; //
let interval = null; //
let bookmarks = []; //
let currentFilename = null; // To store the name of the currently loaded PDF
let totalPages = 0; // To store total pages of the current PDF

const uploadStatus = document.getElementById('uploadStatus');
const textDisplay = document.getElementById('textDisplay');
const fileNameDisplay = document.getElementById('fileNameDisplay');
const estimateDisplay = document.getElementById('estimate');
const wpmDisplay = document.getElementById('wpmDisplay');
const speedSlider = document.getElementById('speedSlider');
const bookmarkNav = document.getElementById('bookmarkNav');
const loadNewButton = document.getElementById('loadNewButton');
const totalPagesDisplay = document.getElementById('totalPagesDisplay');
const chunkSizeInput = document.getElementById('chunkSizeInput');
const pageJumpInput = document.getElementById('pageJumpInput');


function displayFileName(input) { //
    if (input.files && input.files[0]) {
        fileNameDisplay.textContent = input.files[0].name; //
    } else {
        fileNameDisplay.textContent = 'Geen bestand gekozen'; //
    }
}

function uploadPDF() {
    const input = document.getElementById('pdfInput');
    const file = input.files[0];
    if (!file) return;

    const formData = new FormData(); //
    formData.append('pdf', file); //
    formData.append('chunk_size', chunkSizeInput.value);

    uploadStatus.textContent = 'Uploading and processing... ⏳';
    uploadStatus.style.color = '#555';
    textDisplay.textContent = '...';


    fetch('/upload', { //
        method: 'POST', //
        body: formData //
    })
    .then(res => {
        if (!res.ok) {
            return res.json().then(errData => {
                throw new Error(errData.error || `Server error: ${res.status}`);
            });
        }
        return res.json(); //
    })
    .then(data => {
        if (data.error) { // Handle explicit errors from backend
             throw new Error(data.error);
        }
        chunks = data.chunks; //
        currentFilename = data.filename;
        totalPages = data.total_pages;
        index = 0; //
        bookmarks = []; //
        updateBookmarkNav(); //
        updateEstimatedTime(); //
        uploadStatus.textContent = `Successfully loaded: ${currentFilename}`;
        uploadStatus.style.color = 'green';
        loadNewButton.style.display = 'inline-block';
        totalPagesDisplay.textContent = `Total Pages: ${totalPages}`;
        pageJumpInput.max = totalPages;
        play(); //
    })
    .catch(error => {
        console.error('Upload error:', error);
        uploadStatus.textContent = `Error: ${error.message}`;
        uploadStatus.style.color = 'red';
        fileNameDisplay.textContent = 'Geen bestand gekozen';
        textDisplay.textContent = 'Failed to load PDF.';
        currentFilename = null;
        totalPages = 0;
        totalPagesDisplay.textContent = '';
        loadNewButton.style.display = 'none';
    });
}


function showChunk() { //
    if (index < chunks.length) {
        textDisplay.innerText = chunks[index]; //
    } else {
        if (chunks.length > 0) { // Only show "End" if there was content
            textDisplay.innerText = "--- End ---";
        }
        clearInterval(interval); //
    }
}

function play() { //
    if (chunks.length === 0) {
        uploadStatus.textContent = 'No content to play. Please upload a PDF.';
        uploadStatus.style.color = 'orange';
        return;
    }
    clearInterval(interval); //
    const wpm = speedSlider.value; //
    // The formula (60 / wpm) * 1000 gives delay per word.
    // If a chunk has N words, the delay for the chunk is (60 / wpm) * 1000 * N_words_in_chunk.
    // For simplicity, we assume chunk_size from input is average words per chunk.
    // A more accurate way would be to count words in the current chunk if they vary.
    // The current code assumes each chunk is one "display unit" for WPM.
    // Let's adjust to be more aligned with typical speed reading of X words per minute.
    // The current app.py defines chunk_size as number of words.
    // So, delay = ( (words_in_chunk * 60) / wpm ) * 1000
    // If chunk_size is 3, delay = ( (3 * 60) / wpm ) * 1000
    const wordsInChunk = parseInt(chunkSizeInput.value) || 3; // Use current chunk size
    const delay = ( (wordsInChunk * 60) / wpm ) * 1000;

    interval = setInterval(() => { //
        showChunk(); //
        if (index < chunks.length) { // Only increment if not past the end
             index++; //
        } else {
            clearInterval(interval);
        }
    }, delay);
}

function pause() { //
    clearInterval(interval); //
    let currentText = (index < chunks.length && index >= 0) ? chunks[index] : '';
    let previousText = (index > 0 && (index - 1) < chunks.length) ? chunks[index - 1] : '';
    
    if (previousText && currentText) {
        textDisplay.innerText = `${previousText}\n${currentText}`; //
    } else if (currentText) {
        textDisplay.innerText = currentText;
    } else if (previousText) {
         textDisplay.innerText = previousText; // If paused at the very end, show last item
    }
    // If index is 0, only current chunk is shown by default logic or "..." if no chunks
}

function rewind() { //
    // Modified to go back one chunk
    index = Math.max(index - 1, 0); // logic was index - 2
    showChunk(); //
    // If playing, restart play to reflect new position, otherwise just show
    if (interval) { // If it was playing, resume from new spot
        play();
    }
}

function bookmark() { //
    if (chunks.length === 0 || index >= chunks.length || index < 0) return; //
    // Ensure index is valid for bookmarking current chunk
    const currentChunkForBookmark = chunks[index];
    if (currentChunkForBookmark) {
        bookmarks.push({ index: index, text: currentChunkForBookmark }); //
        updateBookmarkNav(); //
    }
}

function updateBookmarkNav() { //
    bookmarkNav.innerHTML = ''; //
    bookmarks.forEach((b, i) => { //
        const btn = document.createElement('button'); //
        btn.textContent = `#${i + 1}: ${b.text.substring(0, 20)}...`; //
        btn.onclick = () => { //
            index = b.index; //
            showChunk(); //
             if (interval) play(); // resume if was playing
        };
        bookmarkNav.appendChild(btn); //
    });
}

function updateWPM() { //
    const wpm = speedSlider.value; //
    wpmDisplay.innerText = `${wpm} WPM`; //
    updateEstimatedTime(); //
    if (interval && chunks.length > 0) { // If playing, restart with new speed
        play();
    }
}

function updateEstimatedTime() { //
    if (chunks.length === 0) {
        estimateDisplay.innerText = 'Geschat: - min'; // for original text
        return;
    }
    const wpm = speedSlider.value; //
    // Assuming each chunk represents 'chunkSizeInput.value' words on average.
    const wordsPerChunk = parseInt(chunkSizeInput.value) || 3;
    const totalWords = chunks.length * wordsPerChunk; // Approximation
    const estMinutes = Math.ceil(totalWords / wpm); //
    estimateDisplay.innerText = `Geschat: ${estMinutes} min`; //
}

function loadNewPDF() {
    clearInterval(interval);
    chunks = [];
    index = 0;
    bookmarks = [];
    currentFilename = null;
    totalPages = 0;
    
    textDisplay.textContent = '...';
    fileNameDisplay.textContent = 'Geen bestand gekozen';
    uploadStatus.textContent = '';
    estimateDisplay.innerText = 'Geschat: - min';
    totalPagesDisplay.textContent = '';
    updateBookmarkNav();
    document.getElementById('pdfInput').value = null; // Reset file input
    loadNewButton.style.display = 'none';
    pageJumpInput.value = '';
    pageJumpInput.max = null;
}

function jumpToPageHandler() {
    const pageNumber = parseInt(pageJumpInput.value);
    if (!currentFilename || isNaN(pageNumber) || pageNumber < 1 || pageNumber > totalPages) {
        uploadStatus.textContent = `Invalid page number. Must be between 1 and ${totalPages}.`;
        uploadStatus.style.color = 'orange';
        return;
    }

    uploadStatus.textContent = `Jumping to page ${pageNumber}... ⏳`;
    uploadStatus.style.color = '#555';

    fetch('/jump', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            filename: currentFilename,
            page_number: pageNumber,
            chunk_size: chunkSizeInput.value
        })
    })
    .then(res => {
        if (!res.ok) {
            return res.json().then(errData => {
                throw new Error(errData.error || `Server error: ${res.status}`);
            });
        }
        return res.json();
    })
    .then(data => {
         if (data.error) {
             throw new Error(data.error);
        }
        chunks = data.chunks;
        index = 0; // Start from the beginning of the new chunk set
        // Bookmarks are typically for the whole document context, might need rethinking with page jumps
        // For now, let's clear them or keep them, user can decide. Let's clear.
        bookmarks = []; 
        updateBookmarkNav();
        updateEstimatedTime(); // This will now be for the remainder of the document from this page
        uploadStatus.textContent = `Now starting from page ${pageNumber} of ${currentFilename}.`;
        uploadStatus.style.color = 'green';
        play(); // Automatically start playing from the new position
    })
    .catch(error => {
        console.error('Page jump error:', error);
        uploadStatus.textContent = `Error jumping to page: ${error.message}`;
        uploadStatus.style.color = 'red';
    });
}

// Initial setup
updateWPM(); // To set initial WPM display and estimate based on default.