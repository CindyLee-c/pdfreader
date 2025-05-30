// script.js
let chunks = [];
let index = 0;
let interval = null;
let bookmarks = [];
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


function displayFileName(input) {
    if (input.files && input.files[0]) {
        fileNameDisplay.textContent = input.files[0].name;
    } else {
        fileNameDisplay.textContent = 'Geen bestand gekozen';
    }
}

function uploadPDF() {
    const input = document.getElementById('pdfInput');
    const file = input.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('pdf', file);
    // BELANGRIJKE WIJZIGING: Lees de waarde van chunkSizeInput hier opnieuw uit
    formData.append('chunk_size', parseInt(chunkSizeInput.value) || 3);

    uploadStatus.textContent = 'Uploading and processing... ⏳';
    uploadStatus.style.color = '#555';
    textDisplay.textContent = '...';


    fetch('/upload', {
        method: 'POST',
        body: formData
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
        currentFilename = data.filename;
        totalPages = data.total_pages; // Wordt hier correct opgehaald vanuit de backend
        index = 0;
        bookmarks = [];
        updateBookmarkNav();
        updateEstimatedTime(); // Zorgt dat de schatting met de nieuwe chunk size klopt
        uploadStatus.textContent = `Successfully loaded: ${currentFilename}`;
        uploadStatus.style.color = 'green';
        loadNewButton.style.display = 'inline-block';
        totalPagesDisplay.textContent = `Total Pages: ${totalPages}`; // Toont het totale aantal pagina's
        pageJumpInput.max = totalPages; // Zet de 'max' attribuut voor de input
        // pageJumpInput.value = ''; // Deze regel kan weg, de gebruiker kan zijn vorige invoer behouden

        play();
    })
    .catch(error => {
        console.error('Upload error:', error);
        uploadStatus.textContent = `Error: ${error.message}`;
        uploadStatus.style.color = 'red';
        fileNameDisplay.textContent = 'Geen bestand gekozen';
        textDisplay.textContent = 'Failed to load PDF.';
        currentFilename = null;
        totalPages = 0; // Zorg dat totalPages nul is bij een fout
        totalPagesDisplay.textContent = ''; // Maak de display leeg bij een fout
        loadNewButton.style.display = 'none';
        setTimeout(() => {
            uploadStatus.textContent = '';
        }, 4000);
    });
}


function showChunk() {
    if (index < chunks.length) {
        textDisplay.innerText = chunks[index];
    } else {
        if (chunks.length > 0) { // Only show "End" if there was content
            textDisplay.innerText = "--- End ---";
        }
        clearInterval(interval);
    }
}

function play() {
    if (chunks.length === 0) {
        uploadStatus.textContent = 'No content to play. Please upload a PDF.';
        uploadStatus.style.color = 'orange';
        setTimeout(() => {
            uploadStatus.textContent = '';
        }, 4000);
        return;
    }
    clearInterval(interval);
    const wpm = speedSlider.value;
    const wordsInChunk = parseInt(chunkSizeInput.value) || 3; // Use current chunk size
    const delay = ( (wordsInChunk * 60) / wpm ) * 1000;

    interval = setInterval(() => {
        showChunk();
        if (index < chunks.length) {
             index++;
        } else {
            clearInterval(interval);
        }
    }, delay);
}

function pause() {
    clearInterval(interval);
    let currentText = (index < chunks.length && index >= 0) ? chunks[index] : '';
    let previousText = (index > 0 && (index - 1) < chunks.length) ? chunks[index - 1] : '';
    
    if (previousText && currentText) {
        textDisplay.innerText = `${previousText}\n${currentText}`;
    } else if (currentText) {
        textDisplay.innerText = currentText;
    } else if (previousText) {
         textDisplay.innerText = previousText; // If paused at the very end, show last item
    }
}

function rewind() {
    // Modified to go back one chunk
    index = Math.max(index - 1, 0);
    showChunk();
    // If playing, restart play to reflect new position, otherwise just show
    if (interval) {
        play();
    }
}

function bookmark() {
    if (chunks.length === 0 || index >= chunks.length || index < 0) return;
    // Ensure index is valid for bookmarking current chunk
    const currentChunkForBookmark = chunks[index];
    if (currentChunkForBookmark) {
        bookmarks.push({ index: index, text: currentChunkForBookmark });
        updateBookmarkNav();
    }
}

function updateBookmarkNav() {
    bookmarkNav.innerHTML = '';
    bookmarks.forEach((b, i) => {
        const btn = document.createElement('button');
        btn.textContent = `#${i + 1}: ${b.text.substring(0, 20)}...`;
        btn.onclick = () => {
            index = b.index;
            showChunk();
             if (interval) play(); // resume if was playing
        };
        bookmarkNav.appendChild(btn);
    });
}

function updateWPM() {
    const wpm = speedSlider.value;
    wpmDisplay.innerText = `${wpm} WPM`;
    updateEstimatedTime();
    if (interval && chunks.length > 0) {
        play();
    }
}

function updateEstimatedTime() {
    if (chunks.length === 0 || isNaN(parseInt(chunkSizeInput.value))) { // Voeg isNaN check toe
        estimateDisplay.innerText = 'Geschat: - min';
        return;
    }
    const wpm = speedSlider.value;
    const wordsPerChunk = parseInt(chunkSizeInput.value) || 3; // Zorg dat dit altijd een nummer is
    const totalWords = chunks.length * wordsPerChunk;
    const estMinutes = Math.ceil(totalWords / wpm);
    estimateDisplay.innerText = `Geschat: ${estMinutes} min`;
}

function loadNewPDF() {
    clearInterval(interval);
    chunks = [];
    index = 0;
    bookmarks = [];
    currentFilename = null;
    totalPages = 0; // Reset totalPages bij nieuw laden
    
    textDisplay.textContent = '...';
    fileNameDisplay.textContent = 'Geen bestand gekozen';
    uploadStatus.textContent = '';
    estimateDisplay.innerText = 'Geschat: - min';
    totalPagesDisplay.textContent = ''; // Leeg de display
    updateBookmarkNav();
    document.getElementById('pdfInput').value = null; // Reset file input
    loadNewButton.style.display = 'none';
    pageJumpInput.value = ''; // Maak pageJumpInput leeg
    pageJumpInput.max = null; // Reset de max attribuut
}

function jumpToPageHandler() {
    const pageNumber = parseInt(pageJumpInput.value);
    const selectedChunkSize = parseInt(chunkSizeInput.value) || 3; // Haal de actuele chunk size op

    // Valideer nu of totalPages een nummer is
    if (!currentFilename || isNaN(pageNumber) || pageNumber < 1 || isNaN(totalPages) || pageNumber > totalPages) { // Controleer op isNaN(totalPages)
        uploadStatus.textContent = `Ongeldig paginanummer. Moet tussen 1 en ${totalPages || 'het totale aantal pagina\'s'} zijn.`; // Pas de melding aan
        uploadStatus.style.color = 'orange';
        setTimeout(() => {
            uploadStatus.textContent = '';
        }, 4000);
        return;
    }

    uploadStatus.textContent = `Springt naar pagina ${pageNumber}... ⏳`;
    uploadStatus.style.color = '#555';

    fetch('/jump', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            filename: currentFilename,
            page_number: pageNumber,
            chunk_size: selectedChunkSize // Gebruik de opgehaalde waarde
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
        index = 0;
        bookmarks = [];
        updateBookmarkNav();
        updateEstimatedTime();
        uploadStatus.textContent = `Nu beginnend vanaf pagina ${pageNumber} van ${currentFilename}.`;
        uploadStatus.style.color = 'green';
        play();
    })
    .catch(error => {
        console.error('Page jump error:', error);
        uploadStatus.textContent = `Fout bij springen naar pagina: ${error.message}`;
        uploadStatus.style.color = 'red';
        setTimeout(() => {
            uploadStatus.textContent = '';
        }, 4000);
    });
}

// Initial setup (deze wordt uitgevoerd bij het laden van de pagina)
updateWPM();