console.log("✅ main.js läuft");

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

let supabase;

async function getConfig() {
  try {
    const res = await fetch('/api/config');
    if (!res.ok) throw new Error(`Fehler beim Abrufen der Config: ${res.status}`);
    const config = await res.json();
    return config;
  } catch (err) {
    console.error("❌ getConfig fehlgeschlagen:", err.message);
    document.getElementById("app").innerHTML = "❌ Fehler beim Initialisieren.";
  }
}

getConfig().then(config => {
  if (!config) return;
  supabase = createClient(config.supabaseUrl, config.publicAnonKey);
  updateArticles(); // erst dann starten
});

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
    console.error("❌ Supabase-Fehler:", error.message);
    app.innerHTML = "❌ Fehler beim Laden.";
    return;
  }

  if (!data.length) {
    app.innerHTML = "⚠️ Keine Artikel aus den letzten 24 Stunden.";
    return;
  }

  app.innerHTML = "";
  data.forEach(a => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <h3>${a.titel}</h3>
      <p>${a.beschreibung || "Kein Beschreibungstext vorhanden."}</p>
      <small>📅 ${new Date(a.zeitstempel).toLocaleString()}</small>
    `;
    app.appendChild(card);
  });
}

async function updateArticles() {
  const btn = document.getElementById("updateBtn");
  if (!btn) return;

  btn.disabled = true;
  btn.textContent = "⏳ Lade neue Artikel...";
  try {
    const res = await fetch("/api/rss");
    const result = await res.json();
    console.log("🆕 Neue Artikel:", result.inserted);
    await ladeArtikel();
  } catch (err) {
    console.error("❌ updateArticles fehlgeschlagen:", err.message);
  }
  btn.disabled = false;
  btn.textContent = "Artikel aktualisieren";
}

window.updateArticles = updateArticles;
