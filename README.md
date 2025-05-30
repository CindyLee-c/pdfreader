# PDF Speed Reader

## Over dit project
Dit is een webgebaseerde PDF Reader, ontworpen om je te helpen sneller PDF-documenten te lezen door de tekst in beheersbare "chunks" te presenteren met een instelbare snelheid. Het project is gebouwd met Flask voor de backend en maakt gebruik van HTML, CSS en JavaScript voor de frontend, samen met PyPDF2 voor PDF-verwerking.

## Functies
* **PDF Upload:** Upload eenvoudig je PDF-bestanden via de webinterface.
* **Aanpasbare Leessnelheid (WPM):** Stel je gewenste leessnelheid in (Words Per Minute) om comfortabel te lezen.
* **Tekst in Chunks:** De tekst wordt opgesplitst in kleine, gemakkelijk te verwerken stukjes (chunks) voor een betere leeservaring.
* **Aanpasbare Chunk Grootte:** Bepaal zelf hoeveel woorden er per chunk worden weergegeven.
* **Navigatie:** Pauzeer, speel af en ga terug naar de vorige chunk.
* **Bladwijzers (Bookmarks):** Markeer belangrijke punten in de tekst om later gemakkelijk terug te keren.
* **Paginanavigatie:** Spring direct naar een specifieke pagina in het PDF-document.
* **Geschatte Leestijd:** Krijg een indicatie van de geschatte leestijd voor het hele document.
* **URL- en Formattering Verwijdering:** De geëxtraheerde tekst wordt opgeschoond van URL's, paginanummers, copyright-informatie en andere ongewenste formatteertekens voor een vloeiendere leesstroom.

## Installatie
Volg deze stappen om de PDF Reader lokaal op te zetten en te draaien:

### Vereisten
* Python 3.x
* pip (Python package installer)

### Stappen
1.  **Kloon de repository:**
    ```bash
    git clone [https://github.com/CindyLee-c/pdfreader.git](https://github.com/CindyLee-c/pdfreader.git)
    cd pdfreader
    ```

2.  **Maak virtuele omgeving aan en activeer deze (aanbevolen):**
    ```bash
    python -m venv venv
    # Op Windows:
    venv\Scripts\activate
    # Op macOS/Linux:
    source venv/bin/activate
    ```

3.  **Installeer de vereiste Python-pakketten:**
    ```bash
    pip install Flask PyPDF2
    ```

4.  **Plaats de bestanden correct:**
    Zorg ervoor dat je projectstructuur er als volgt uitziet:
    ```
    pdfreader/
    ├── app.py
    ├── cleaner.py
    ├── page_jump.py
    ├── README.md
    ├── uploads/                 (map voor geüploade PDF's)
    ├── templates/
    │   └── index.html
    └── static/
        ├── style.css
        └── script.js
    ```
    De bestanden `script.js` en `style.css` moeten in de `static/` map staan, en `index.html` in de `templates/` map. De `uploads/` map moet leeg zijn, maar wel bestaan.

5.  **Start de Flask-applicatie:**
    ```bash
    python app.py
    ```
    De applicatie zal standaard starten op `http://127.0.0.1:5000/`.

## Gebruik
1.  Open je webbrowser en ga naar `http://127.0.0.1:5000/`.
2.  Klik op "Choose File" om een PDF-document te uploaden.
3.  Zodra de PDF is verwerkt, begint de tekst automatisch te scrollen met de ingestelde WPM.
4.  Gebruik de knoppen (`⏸`, `▶`, `⏮`, `🔖`) om de weergave te controleren, bladwijzers toe te voegen en te navigeren.
5.  Pas de "Words/Chunk" en "WPM" sliders aan voor je ideale leeservaring.
6.  Gebruik "Go to Page" om direct naar een specifieke pagina te springen.
7.  Klik op "Load New PDF" om een nieuw bestand te uploaden.

## Bijdragen
Feedback, bugrapporten en suggesties voor nieuwe functies zijn van harte welkom!
1.  Fork de repository.
2.  Maak een nieuwe branch aan (`git checkout -b feature/jouw-functie`).
3.  Voer je wijzigingen door.
4.  Commit je wijzigingen (`git commit -m 'Voeg een nieuwe functie toe'`).
5.  Push naar de branch (`git push origin feature/jouw-functie`).
6.  Open een Pull Request.

## Licentie
Dit project is gelicentieerd onder de MIT-licentie. Zie het `LICENSE` bestand voor meer details.
