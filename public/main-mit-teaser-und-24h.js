console.log("✅ main.js läuft");

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
  'https://fwqzalxpezqdkplgudix.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3cXphbHhwZXpxZGtwbGd1ZGl4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDI4NTUwMywiZXhwIjoyMDU5ODYxNTAzfQ.U-w5Nye44FALf8aH2VDMrVaJ_wsIJ4cyimhp_nGU07o'
);

async function ladeArtikel() {
  const app = document.getElementById("app");
  app.innerHTML = "⏳ Lade Artikel...";

  const seitGestern = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("artikel")
    .select("*")
    .gte("zeitstempel", seitGestern)
    .order("zeitstempel", { ascending: false });

  if (error) {
    console.error(error);
    app.innerHTML = "❌ Fehler beim Laden.";
    return;
  }

  if (!data.length) {
    app.innerHTML = "⚠️ Keine Artikel vorhanden.";
    return;
  }

  app.innerHTML = "";
  data.forEach(a => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <h3>${a.titel}</h3>
      <p>${a.beschreibung || "Kein Beschreibungstext vorhanden."}</p>
    `;
    app.appendChild(card);
  });
}

async function updateArticles() {
  const btn = document.getElementById("updateBtn");
  btn.disabled = true;
  btn.textContent = "⏳ Lade neue Artikel...";
  const res = await fetch("/api/rss");
  const result = await res.json();
  console.log("Neue Artikel:", result.inserted);
  await ladeArtikel();
  btn.disabled = false;
  btn.textContent = "Artikel aktualisieren";
}

window.updateArticles = updateArticles;
updateArticles();
