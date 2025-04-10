console.log("✅ main.js läuft");

async function getConfig() {
  const res = await fetch('/api/config');
  return await res.json();
}

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

let supabase;

getConfig().then(config => {
  supabase = createClient(config.supabaseUrl, config.publicAnonKey);
  updateArticles();
});

let artikelListe = [];

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

  artikelListe = data;
  renderArtikel();
}

function renderArtikel() {
  const app = document.getElementById("app");
  app.innerHTML = "";

  artikelListe.forEach((a, index) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="flex">
        <div style="flex:3;">
          <h3>${a.titel}</h3>
          <p>${a.beschreibung || "Kein Beschreibungstext vorhanden."}</p>
          <small>📅 ${new Date(a.zeitstempel).toLocaleString()}</small><br>
          <a href="${a.link}" target="_blank">🔗 Zum Artikel</a>
        </div>
        <div style="flex:1; padding-left:10px;">
          <select class="prio" data-index="${index}">
            <option value="">- Priorität -</option>
            <option value="1">Artikel 1</option>
            <option value="2">Artikel 2</option>
            <option value="3">Artikel 3</option>
            <option value="4">Artikel 4</option>
          </select><br>
          <label>
            <input type="checkbox" class="hintergrund" data-index="${index}" /> Hintergrundstück
          </label><br>
          <textarea class="begruendung" data-index="${index}" placeholder="Begründung (optional)"></textarea>
        </div>
      </div>
    `;
    app.appendChild(card);
  });

  const promptBtn = document.createElement("button");
  promptBtn.textContent = "Prompt generieren";
  promptBtn.onclick = generierePrompt;
  app.appendChild(promptBtn);
}

function generierePrompt() {
  const prios = [...document.querySelectorAll('.prio')];
  const prioWerte = prios.map(p => p.value).filter(Boolean);

  if (new Set(prioWerte).size !== prioWerte.length) {
    alert("⚠️ Doppelte Priorität vergeben!");
    return;
  }

  fetch('/prompt-vorlage.txt')
    .then(res => res.text())
    .then(vorlage => {
      let prompt = vorlage;

      prios.forEach(select => {
        if (select.value) {
          const artikel = artikelListe[select.dataset.index];
          prompt += `\n\nArtikel ${select.value}:\n${artikel.volltext}`;
        }
      });

      const hintergruende = [...document.querySelectorAll('.hintergrund')]
        .filter(c => c.checked);

      hintergruende.forEach(h => {
        const artikel = artikelListe[h.dataset.index];
        const begruendung = document.querySelector(`.begruendung[data-index="${h.dataset.index}"]`).value || "keine Begründung";
        prompt += `\n\nHintergrundstück:\n${artikel.volltext}\nBegründung: ${begruendung}`;
      });

      navigator.clipboard.writeText(prompt);
      alert("✅ Prompt kopiert!");
    });
}

async function updateArticles() {
  const btn = document.getElementById("updateBtn");
  btn.disabled = true;
  btn.textContent = "⏳ Lade neue Artikel...";
  await fetch("/api/rss");
  await ladeArtikel();
  btn.disabled = false;
  btn.textContent = "Artikel aktualisieren";
}

window.updateArticles = updateArticles;
