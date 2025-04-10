// public/main.js

console.log("✅ Promptgenerator-Frontend geladen");

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

let supabase;

async function getConfig() {
  const res = await fetch('/api/config');
  const config = await res.json();
  return config;
}

getConfig().then(config => {
  supabase = createClient(config.supabaseUrl, config.publicAnonKey);
  ladeArtikel();
});

async function ladeArtikel() {
  const app = document.getElementById("app");
  app.innerHTML = "⏳ Lade Artikel...";

  const { data, error } = await supabase
    .from("artikel")
    .select("id, titel, beschreibung, zeitstempel, link")
    .order("zeitstempel", { ascending: false });

  if (error) {
    console.error(error);
    app.innerHTML = "❌ Fehler beim Laden.";
    return;
  }

  app.innerHTML = '<h2>📰 Artikelübersicht</h2>';
  data.forEach(a => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <h3>${a.titel}</h3>
      <p>${a.beschreibung || "Kein Beschreibungstext."}</p>
      <small>🕒 ${new Date(a.zeitstempel).toLocaleString()}</small><br>
      <a href="${a.link}" target="_blank">🔗 Zum Originalartikel</a><br>
      <label>Einordnen als:
        <select onchange="handleSelection('${a.id}', this.value)">
          <option value="">-</option>
          <option value="1">Priorität 1</option>
          <option value="2">Priorität 2</option>
          <option value="3">Priorität 3</option>
          <option value="4">Priorität 4</option>
          <option value="hintergrund">Hintergrund</option>
        </select>
      </label>
      <br>
      <textarea id="begruendung-${a.id}" placeholder="(Optional) Begründung für Hintergrund" style="display:none"></textarea>
    `;
    app.appendChild(card);
  });

  const generateBtn = document.createElement("button");
  generateBtn.textContent = "🎙️ Prompt generieren";
  generateBtn.onclick = generatePrompt;
  app.appendChild(generateBtn);
}

const auswahl = {};

window.handleSelection = (id, value) => {
  if (value === 'hintergrund') {
    document.getElementById(`begruendung-${id}`).style.display = 'block';
  } else {
    document.getElementById(`begruendung-${id}`).style.display = 'none';
  }
  auswahl[id] = value;
};

async function generatePrompt() {
  const btn = document.querySelector("button");
  btn.disabled = true;
  btn.textContent = "⏳ Erzeuge Prompt...";

  const response = await fetch('/api/prompt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      auswahl,
      begruendungen: Object.fromEntries(
        Object.entries(auswahl)
          .filter(([id, v]) => v === 'hintergrund')
          .map(([id]) => [id, document.getElementById(`begruendung-${id}`).value])
      )
    })
  });

  const result = await response.json();
  const pre = document.createElement("pre");
  pre.textContent = result.prompt;
  document.getElementById("app").appendChild(pre);
  btn.disabled = false;
  btn.textContent = "🎙️ Prompt generieren";
}
