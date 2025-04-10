console.log("✅ NEUE main.js WIRD GELADEN (aus /public)");

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
  'https://fwqzalxpezqdkplgudix.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3cXphbHhwZXpxZGtwbGd1ZGl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQyODU1MDMsImV4cCI6MjA1OTg2MTUwM30.XIAIYCUzNxvRM9R-S3uLLz-XPUC8i7jWSWmhwyWyi4A'
);

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
    `;

    appDiv.appendChild(articleDiv);
  });
}

ladeArtikel();
