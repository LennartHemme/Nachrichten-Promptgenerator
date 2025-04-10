console.log("✅ NEUE main.js WIRD GELADEN (aus /public)");

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
  'https://fwqzalxpezqdkplgudix.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3cXphbHhwZXpxZGtwbGd1ZGl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQyODU1MDMsImV4cCI6MjA1OTg2MTUwM30.XIAIYCUzNxvRM9R-S3uLLz-XPUC8i7jWSWmhwyWyi4A'
);

// Artikel laden
async function ladeArtikel() {
  const appDiv = document.getElementById("app");
  appDiv.innerHTML = "<p>🧪 Lade Artikel aus Supabase…</p>";

  const { data, error } = await supabase
    .from("artikel")
    .select("*")
    .order("zeitstempel", { ascending: false });

  console.log("📦 Supabase-Antwort:", data);

  if (error) {
    console.error("❌ Fehler beim Abrufen:", error);
    appDiv.innerHTML = "<p>Fehler beim Laden der Artikel.</p>";
    return;
  }

  if (!data || data.length === 0) {
    appDiv.innerHTML = "<p>Keine Artikel gefunden.</p>";
    return;
  }

  appDiv.innerHTML = "";

  data.forEach((artikel) => {
    const articleDiv = document.createElement("div");
    articleDiv.classList.add("artikel");

    articleDiv.innerHTML = `
      <h3>🧠 Supabase: ${artikel.titel}</h3>
      ${artikel.volltext ? `<details><summary>Volltext anzeigen</summary><p>${artikel.volltext}</p></details>` : ""}
      <p><strong>Rolle:</strong> ${artikel.rolle || "-"}</p>
      <label>
        <input type="checkbox" ${artikel.ausgewählt ? "checked" : ""} disabled />
        Ausgewählt
      </label><br>
      <label>
        <input type="checkbox" ${artikel.hintergrund ? "checked" : ""} disabled />
        Hintergrundstück
      </label><br>
      ${artikel.hintergrund && artikel.begründung_hintergrund ? `
        <label><strong>Begründung:</strong><br>
          <textarea disabled>${artikel.begründung_hintergrund}</textarea>
        </label>
      ` : ""}
    `;

    appDiv.appendChild(articleDiv);
  });
}

// Artikel aus RSS nach Supabase laden
async function updateArticles() {
  const updateButton = document.querySelector("button[onclick='updateArticles()']");
  if (updateButton) {
    updateButton.textContent = "🔄 Lade neue Artikel…";
    updateButton.disabled = true;
  }

  const res = await fetch("/api/rss");
  const result = await res.json();

  console.log(`🆕 Neue Artikel eingefügt: ${result.inserted}`);

  await ladeArtikel();

  if (updateButton) {
    updateButton.textContent = "Artikel aktualisieren";
    updateButton.disabled = false;
  }
}

// Button-Funktion global verfügbar machen
window.updateArticles = updateArticles;

// Direkt beim Laden: RSS aktualisieren und Artikel anzeigen
updateArticles();
