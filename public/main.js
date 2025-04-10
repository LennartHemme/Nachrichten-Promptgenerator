console.log("✅ main.js läuft");

async function getConfig() {
  const res = await fetch('/api/config');
  return await res.json();
}

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

let supabase;
let config;

getConfig().then(c => {
  config = c;
  supabase = createClient(config.supabaseUrl, config.publicAnonKey);
  updateArticles();
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
    console.error(error);
    app.innerHTML = "❌ Fehler beim Laden.";
    return;
  }

  if (!data.length) {
    app.innerHTML = "⚠️ Keine Artikel aus den letzten 24 Stunden.";
    return;
  }

  app.innerHTML = "";

  const auswahl = ["1", "2", "3", "4", "Hintergrund"];

  data.forEach((a, index) => {
    const card = document.createElement("div");
    card.className = "card";

    const select = document.createElement("select");
    select.innerHTML = `<option value="">Auswahl...</option>` +
      auswahl.map(opt => `<option value="${opt}">${opt}</option>`).join("");
    select.name = "auswahl";
    select.dataset.id = a.id;

    const begruendung = document.createElement("input");
    begruendung.placeholder = "Begründung (optional bei Hintergrund)";
    begruendung.type = "text";
    begruendung.name = "begruendung";
    begruendung.dataset.id = a.id;
    begruendung.className = "input-begruendung";

    card.innerHTML = `
      <h3>${a.titel}</h3>
      <p>${a.beschreibung || "Kein Beschreibungstext vorhanden."}</p>
      <small>📅 ${new Date(a.zeitstempel).toLocaleString()}</small>
      <br><a href="${a.link}" target="_blank">🔗 Zum Artikel</a>
    `;

    card.appendChild(select);
    card.appendChild(begruendung);

    app.appendChild(card);
  });

  const genBtn = document.createElement("button");
  genBtn.textContent = "🎯 Prompt generieren";
  genBtn.onclick = () => generierePrompt(data);
  app.appendChild(genBtn);
}

function generierePrompt(data) {
  const systemPrompt = `--- GPT-PROMPT ---\n` + config.promptVorlage + `\n--- ARTIKEL ---\n`;
  const ausgew = document.querySelectorAll("select[name='auswahl']");
  const map = {};
  ausgew.forEach(sel => {
    if (!sel.value) return;
    if (map[sel.value]) return alert("⚠️ Doppelte Auswahl: " + sel.value);
    map[sel.value] = sel.dataset.id;
  });

  let prompt = systemPrompt;
  Object.entries(map).forEach(([key, id]) => {
    const artikel = data.find(a => a.id === id);
    const begr = document.querySelector(`input[data-id='${id}']`).value;
    prompt += `\n--- ${key} ---\nTitel: ${artikel.titel}\n${artikel.volltext}\n`;
    if (key === "Hintergrund" && begr) prompt += `\nBegründung: ${begr}`;
  });

  navigator.clipboard.writeText(prompt).then(() => alert("📋 Prompt in Zwischenablage!"));
}

async function updateArticles() {
  const btn = document.getElementById("updateBtn");
  if (btn) {
    btn.disabled = true;
    btn.textContent = "⏳ Lade neue Artikel...";
  }
  const res = await fetch("/api/rss");
  const result = await res.json();
  console.log("Neue Artikel:", result.inserted);
  await ladeArtikel();
  if (btn) {
    btn.disabled = false;
    btn.textContent = "Artikel aktualisieren";
  }
}

window.updateArticles = updateArticles;
