console.log("✅ main.js geladen");

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
  'https://fwqzalxpezqdkplgudix.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3cXphbHhwZXpxZGtwbGd1ZGl4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDI4NTUwMywiZXhwIjoyMDU5ODYxNTAzfQ.U-w5Nye44FALf8aH2VDMrVaJ_wsIJ4cyimhp_nGU07o'
);

async function ladeArtikel() {
  const appDiv = document.getElementById("app");
  appDiv.innerHTML = "Artikel werden geladen…";

  const { data, error } = await supabase
    .from("artikel")
    .select("*")
    .order("zeitstempel", { ascending: false });

  if (error) {
    console.error("Fehler:", error);
    appDiv.innerHTML = "Fehler beim Laden.";
    return;
  }

  if (!data || data.length === 0) {
    appDiv.innerHTML = "Keine Artikel vorhanden.";
    return;
  }

  appDiv.innerHTML = "";
  data.forEach(artikel => {
    const div = document.createElement("div");
    div.innerHTML = `<h3>${artikel.titel}</h3><p>${artikel.volltext.slice(0, 300)}...</p>`;
    appDiv.appendChild(div);
  });
}

async function updateArticles() {
  const res = await fetch("/api/rss");
  const result = await res.json();
  console.log("🆕 Neue Artikel:", result.inserted);
  await ladeArtikel();
}

window.updateArticles = updateArticles;

updateArticles();
