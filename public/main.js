console.log("✅ main.js läuft");

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
  'https://fwqzalxpezqdkplgudix.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3cXphbHhwZXpxZGtwbGd1ZGl4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDI4NTUwMywiZXhwIjoyMDU5ODYxNTAzfQ.U-w5Nye44FALf8aH2VDMrVaJ_wsIJ4cyimhp_nGU07o'  // Ersetze diesen durch deinen anon Key
);

// Globale Variable für die Promptvorlage (Systemteil)
let promptTemplate = `System-Vorlage:
Du bist ein Nachrichtenmoderator/in beim Mittagsupdate.
Fasse die ausgewählten Artikel prägnant zusammen.
------------------------------------`;

// Hier kannst du die Vorlage über ein Eingabefeld bearbeiten – standardmäßig in localStorage speichern
function loadPromptTemplate() {
  const stored = localStorage.getItem("promptTemplate");
  if (stored) {
    promptTemplate = stored;
  }
  document.getElementById("promptTemplate").value = promptTemplate;
}

function savePromptTemplate() {
  promptTemplate = document.getElementById("promptTemplate").value;
  localStorage.setItem("promptTemplate", promptTemplate);
}

// Laden der Artikel (nur letzte 24h)
async function ladeArtikel() {
  const app = document.getElementById("app");
  app.innerHTML = "⏳ Artikel werden geladen…";
  const seitGestern = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("artikel")
    .select("*")
    .gte("zeitstempel", seitGestern)
    .order("zeitstempel", { ascending: false });

  if (error) {
    console.error(error);
    app.innerHTML = "❌ Fehler beim Laden der Artikel.";
    return;
  }
  if (!data || data.length === 0) {
    app.innerHTML = "⚠️ Keine Artikel aus den letzten 24 Stunden gefunden.";
    return;
  }

  // Ausgabe der Artikel mit Auswahlmöglichkeiten (Dropdown und Begründung)
  app.innerHTML = "";
  window.articleSelection = {}; // global für Prompt-Generierung
  data.forEach(art => {
    // Initialisiere Auswahl für jeden Artikel
    articleSelection[art.id] = { rolle: "nicht verwenden", begruendung: "" };

    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="card-content">
        <h3><a href="${art.link}" target="_blank">${art.titel}</a></h3>
        <p>${art.beschreibung || "Kein Beschreibungstext vorhanden."}</p>
        <small>📅 ${new Date(art.zeitstempel).toLocaleString("de-DE")}</small>
      </div>
      <div class="card-controls">
        <label>Einordnen als:
          <select id="roleSelect-${art.id}">
            <option value="nicht verwenden">Nicht verwenden</option>
            <option value="artikel1">Artikel 1</option>
            <option value="artikel2">Artikel 2</option>
            <option value="artikel3">Artikel 3</option>
            <option value="artikel4">Artikel 4</option>
            <option value="hintergrund">Hintergrundstück</option>
          </select>
        </label>
        <br/>
        <label>Begründung (optional):
          <input type="text" id="begr-${art.id}" placeholder="Begründung"/>
        </label>
      </div>
    `;
    app.appendChild(card);

    // Event-Listener für Dropdown
    const roleSelect = document.getElementById(`roleSelect-${art.id}`);
    roleSelect.addEventListener("change", ev => {
      articleSelection[art.id].rolle = ev.target.value;
      checkDuplicatePrioritäten();
    });
    // Event-Listener für Begründung
    const begrInput = document.getElementById(`begr-${art.id}`);
    begrInput.addEventListener("input", ev => {
      articleSelection[art.id].begruendung = ev.target.value;
    });
  });
}

// Überprüft, ob kritische Prioritäten doppelt vergeben wurden (z.B. "artikel1" oder "hintergrund")
function checkDuplicatePrioritäten() {
  const count = {};
  Object.values(articleSelection).forEach(sel => {
    const r = sel.rolle;
    if (!count[r]) count[r] = 0;
    count[r]++;
  });
  if (count["artikel1"] > 1 || count["hintergrund"] > 1) {
    console.warn("Doppelte Priorität: Bitte nur einen Artikel pro kritischer Kategorie auswählen.");
  }
}

// Prompt generieren: System-Prompt plus dynamisch zusammengefassten Content aus den Artikel-Auswahlen.
// Dabei wird der automatisch gescrapete Volltext aus der Supabase verwendet.
async function generatePrompt() {
  const nameField = document.getElementById("autorName").value.trim() || "n.n.";
  let prompt = promptTemplate + "\n\n" + "Name: " + nameField + "\n\n";
  prompt += "Ausgewählte Artikel:\n";
  
  // Hole Artikel aus Supabase (letzte 24h)
  const seitGestern = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("artikel")
    .select("*")
    .gte("zeitstempel", seitGestern)
    .order("zeitstempel", { ascending: false });

  if (error || !data) {
    prompt += "Fehler beim Abrufen der Artikel.";
  } else {
    data.forEach(art => {
      const sel = articleSelection[art.id];
      if (!sel || sel.rolle
