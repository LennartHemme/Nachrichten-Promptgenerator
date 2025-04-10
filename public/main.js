console.log("✅ main.js");

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
  'https://fwqzalxpezqdkplgudix.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3cXphbHhwZXpxZGtwbGd1ZGl4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDI4NTUwMywiZXhwIjoyMDU5ODYxNTAzfQ.U-w5Nye44FALf8aH2VDMrVaJ_wsIJ4cyimhp_nGU07o'  // ← Dein "anon" Key!
);

let articleSelection = {}; // key = artikel.id, value = { rolle, begründung }

async function ladeArtikel() {
  const appDiv = document.getElementById("app");
  appDiv.innerHTML = "⏳ Lade Artikel...";

  // Filter in supabase: nur letzte 24h
  const seitGestern = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("artikel")
    .select("*")
    .gte("zeitstempel", seitGestern)
    .order("zeitstempel", { ascending: false });

  if (error) {
    console.error(error);
    appDiv.innerHTML = "❌ Fehler beim Laden.";
    return;
  }

  if (!data || data.length === 0) {
    appDiv.innerHTML = "Keine Artikel in den letzten 24h gefunden.";
    return;
  }

  // Ausgabe
  appDiv.innerHTML = "";
  data.forEach(art => {
    // Article selection default
    articleSelection[art.id] = {
      rolle: "nicht verwenden",
      begruendung: ""
    };

    const card = document.createElement("div");
    card.className = "card";

    const roleSelectId = `roleSelect-${art.id}`;
    const begrId = `begr-${art.id}`;

    card.innerHTML = `
      <h3>${art.titel}</h3>
      <p>${art.beschreibung || "Kein Beschreibungstext vorhanden."}</p>
      <button class="volltext-btn" data-id="${art.id}" data-link="${art.link}">Volltext anfordern</button>
      <p style="color:#888;font-size:0.9em;">${art.volltext ? art.volltext.slice(0,150) + "..." : ""}</p>

      <label>Einordnen als:
        <select id="${roleSelectId}">
          <option value="nicht verwenden">Nicht verwenden</option>
          <option value="artikel1">Artikel 1</option>
          <option value="artikel2">Artikel 2</option>
          <option value="artikel3">Artikel 3</option>
          <option value="artikel4">Artikel 4</option>
          <option value="hintergrund">Hintergrundstück</option>
        </select>
      </label>
      <br/>
      <label>Begründung (optional):</label>
      <br/>
      <textarea id="${begrId}" rows="2" style="width:100%"></textarea>

      <small>📅 ${new Date(art.zeitstempel).toLocaleString()}</small>
    `;

    appDiv.appendChild(card);

    // Event-Listener
    const roleSelect = card.querySelector(`#${roleSelectId}`);
    roleSelect.addEventListener("change", (ev) => {
      articleSelection[art.id].rolle = ev.target.value;
    });

    const begrTextarea = card.querySelector(`#${begrId}`);
    begrTextarea.addEventListener("input", (ev) => {
      articleSelection[art.id].begruendung = ev.target.value;
    });

    // Volltext-Button
    const vollBtn = card.querySelector(".volltext-btn");
    vollBtn.addEventListener("click", async (ev) => {
      const link = ev.target.dataset.link;
      const articleId = ev.target.dataset.id;
      ev.target.disabled = true;
      ev.target.textContent = "Scraping...";
      await scrapeVolltext(articleId, link);
      ev.target.textContent = "Volltext anfordern";
      ev.target.disabled = false;
      // nach dem Scrapen neu laden, um updated volltext anzuzeigen
      ladeArtikel();
    });
  });
}

async function scrapeVolltext(id, link) {
  const response = await fetch(`/api/scrape?link=${encodeURIComponent(link)}&id=${encodeURIComponent(id)}`);
  const result = await response.json();
  console.log("Scrape result:", result);
}

window.updateArticles = async function() {
  const btn = document.getElementById("updateBtn");
  btn.disabled = true;
  btn.textContent = "🔄 Lade neue Artikel...";
  const res = await fetch("/api/rss");
  const data = await res.json();
  console.log("Artikel aktualisiert, inserted:", data.inserted);

  await ladeArtikel();
  btn.disabled = false;
  btn.textContent = "Artikel aktualisieren";
};

window.generatePrompt = function() {
  const autorName = document.getElementById("autorName").value.trim() || "n.n.";
  
  // Bau Prompt aus Template
  // Du kannst dieses Template beliebig anpassen
  let prompt = `GPT-4 System:
Du bist Nachrichten-Sprecher:in für das Mittagsupdate bei Radio Emscher Lippe.
Name: ${autorName}

Wir haben folgende Artikel-Auswahl:
-----------------------
`;

  // Sortiere die Einträge nach (artikel1, artikel2, artikel3, artikel4, hintergrund)
  // => mappe articleSelection
  // => wir brauchen die Originaldaten (Titel, Teaser, Volltext) -> local an selection?
  // => Lass uns "data" global cachen? Oder ruf nochmal supabase ab? -> Trick: wir haben data aus ladeArtikel. 
  // => hier vereinfachen wir: wir rufen supabase nochmal ab und filtern.

  prompt += "Wir fassen die ausgewählten Artikel zusammen:\n";

  // local approach: just do a supabase call
  finalizePrompt(autorName, prompt);
};

async function finalizePrompt(autorName, basePrompt) {
  const seitGestern = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("artikel")
    .select("*")
    .gte("zeitstempel", seitGestern)
    .order("zeitstempel", { ascending: false });

  let prompt = basePrompt;

  if (!error && data) {
    // Gehe durch die data, schau in articleSelection
    const chosen = [];
    data.forEach(art => {
      const sel = articleSelection[art.id];
      if (!sel) return;
      if (sel.rolle === "nicht verwenden") return;

      const rolle = sel.rolle;
      const begr = sel.begruendung;
      chosen.push({ art, rolle, begr });
    });

    // Sortierung: artikel1 -> artikel2 -> artikel3 -> artikel4 -> hintergrund
    const order = { artikel1: 1, artikel2: 2, artikel3: 3, artikel4: 4, hintergrund: 5 };
    chosen.sort((a,b) => (order[a.rolle]||99) - (order[b.rolle]||99));

    chosen.forEach(ch => {
      prompt += `\n--- [${ch.rolle}] ---\nTitel: ${ch.art.titel}\nTeaser: ${ch.art.beschreibung}\nVolltext: ${ch.art.volltext}\nBegründung: ${ch.begr || "n/a"}\n`;
    });

    prompt += "\nBitte formuliere daraus ein knackiges Mittagsupdate.\nSei präzise, aber kurz.\n";

    showPromptModal(prompt);
  }
}

function showPromptModal(text) {
  document.getElementById("promptText").textContent = text;
  document.getElementById("promptDialog").showModal();
}

window.closeDialog = function() {
  document.getElementById("promptDialog").close();
};

window.copyPrompt = function() {
  const txt = document.getElementById("promptText").textContent;
  navigator.clipboard.writeText(txt);
};

updateArticles();
