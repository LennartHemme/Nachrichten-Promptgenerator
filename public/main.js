// /public/main.js
console.log("✅ main.js läuft");

async function getConfig() {
  const res = await fetch('/api/config');
  return await res.json();
}

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

let supabase;

getConfig().then(config => {
  supabase = createClient(config.supabaseUrl, config.publicAnonKey);
  ladeArtikel();
});

async function ladeArtikel() {
  const app = document.getElementById("app");
  app.innerHTML = "⏳ Lade Artikel...";

  const { data, error } = await supabase
    .from("artikel")
    .select("id, titel, beschreibung, zeitstempel, volltext")
    .order("zeitstempel", { ascending: false });

  if (error) {
    console.error(error);
    app.innerHTML = "❌ Fehler beim Laden.";
    return;
  }

  app.innerHTML = `<h2>📰 Artikelübersicht</h2>`;

  const roles = ['artikel1', 'artikel2', 'artikel3', 'artikel4', 'hintergrund'];
  const selections = {};

  data.forEach(a => {
    const wrapper = document.createElement("div");
    wrapper.className = "card";
    wrapper.innerHTML = `
      <h3>${a.titel}</h3>
      <p>${a.beschreibung || "(Kein Beschreibungstext)"}</p>
      <small>📅 ${new Date(a.zeitstempel).toLocaleString()}</small>
      <div class="select-row">
        ${roles.map(role => `
          <label>
            <input type="radio" name="${role}" value="${a.id}" onchange="updateSelection('${role}', ${a.id})">
            ${role === 'hintergrund' ? 'Hintergrund' : role.replace('artikel', 'Artikel ')}
          </label>`).join('')}
      </div>
      <div class="reason" id="reason-${a.id}" style="display:none">
        <label>Begründung (optional): <input type="text" id="input-${a.id}" /></label>
      </div>
    `;
    app.appendChild(wrapper);
  });

  window.updateSelection = (role, id) => {
    selections[role] = id;
    // Hintergrund: Begründung anzeigen
    document.querySelectorAll('.reason').forEach(e => e.style.display = 'none');
    if (role === 'hintergrund') {
      document.getElementById(`reason-${id}`).style.display = 'block';
    }
    generatePrompt(data, selections);
  };
}

async function generatePrompt(data, selections) {
  const res = await fetch('/data/promptvorlage.txt');
  const promptTemplate = await res.text();

  let promptText = promptTemplate + "\n\n";
  const used = new Set();

  ['artikel1', 'artikel2', 'artikel3', 'artikel4'].forEach((role, idx) => {
    const id = selections[role];
    if (id && used.has(id)) {
      promptText += `⚠️ Artikel ${idx + 1} ist doppelt ausgewählt!\n`;
    }
    const artikel = data.find(a => a.id === id);
    if (artikel) {
      used.add(id);
      promptText += `Artikel ${idx + 1}: ${artikel.titel}\n${artikel.volltext}\n\n`;
    }
  });

  const hId = selections['hintergrund'];
  if (hId) {
    const a = data.find(a => a.id === hId);
    if (a) {
      const reason = document.getElementById(`input-${a.id}`).value;
      promptText += `Hintergrundstück: ${a.titel}\n${reason ? 'Begründung: ' + reason + '\n' : ''}${a.volltext}\n`;
    }
  }

  const out = document.getElementById("prompt");
  out.value = promptText;
}
