// 📄 main.js

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
  'https://fwqzalxpezqdkplgudix.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3cXphbHhwZXpxZGtwbGd1ZGl4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDI4NTUwMywiZXhwIjoyMDU5ODYxNTAzfQ.U-w5Nye44FALf8aH2VDMrVaJ_wsIJ4cyimhp_nGU07o'
);

const promptVorlageInput = document.getElementById("prompt-vorlage");
const speichernBtn = document.getElementById("vorlage-speichern");

// 🧠 Vorlage speichern
speichernBtn.addEventListener("click", async () => {
  const text = promptVorlageInput.value;
  localStorage.setItem("promptSystemVorlage", text);
  alert("Vorlage gespeichert!");
});

function formatDate(d) {
  return new Date(d).toLocaleString("de-DE", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

async function ladeArtikel() {
  const app = document.getElementById("app");
  app.innerHTML = "⏳ Lade Artikel...";

  const seitGestern = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("artikel")
    .select("id, titel, beschreibung, link, volltext, prioritaet, begruendung, hintergrund, zeitstempel")
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

  data.forEach((a) => {
    const card = document.createElement("div");
    card.className = "card";

    const prioritaetOptions = ["Artikel 1", "Artikel 2", "Artikel 3", "Artikel 4", "Hintergrund"]
      .map(opt => `<option value="${opt}" ${a.prioritaet === opt ? 'selected' : ''}>${opt}</option>`) 
      .join("");

    card.innerHTML = `
      <h3>${a.titel}</h3>
      <p>${a.beschreibung}</p>
      <small>📅 ${formatDate(a.zeitstempel)} | <a href="${a.link}" target="_blank">🔗 Link</a></small>
      <textarea placeholder="Optionaler Begründungstext..." data-id="${a.id}" class="begruendung">${a.begruendung || ""}</textarea>
      <label>Einordnen als:
        <select class="prioritaet" data-id="${a.id}">
          <option value="">Keine Auswahl</option>
          ${prioritaetOptions}
        </select>
      </label>
    `;
    app.appendChild(card);
  });

  // Event-Handler für Auswahl + Begründung speichern
  document.querySelectorAll(".prioritaet").forEach(sel => {
    sel.addEventListener("change", async (e) => {
      const id = e.target.dataset.id;
      const prioritaet = e.target.value;
      const begruendung = document.querySelector(`.begruendung[data-id='${id}']`).value;
      await supabase.from("artikel").update({ prioritaet, begruendung }).eq("id", id);
      ladeArtikel(); // Reload zum doppelten Filtern
    });
  });

  document.querySelectorAll(".begruendung").forEach(txt => {
    txt.addEventListener("blur", async (e) => {
      const id = e.target.dataset.id;
      const begruendung = e.target.value;
      await supabase.from("artikel").update({ begruendung }).eq("id", id);
    });
  });
}

// 🧠 Prompt generieren
async function generierePrompt() {
  const { data } = await supabase.from("artikel").select("prioritaet, titel, volltext, begruendung");
  const systemVorlage = localStorage.getItem("promptSystemVorlage") || "";

  const sortierte = ["Artikel 1", "Artikel 2", "Artikel 3", "Artikel 4", "Hintergrund"]
    .map(label => data.find(d => d.prioritaet === label))
    .filter(Boolean);

  const blocks = sortierte.map(a => `### ${a.prioritaet}: ${a.titel}
${a.volltext}
${a.begruendung ? `\n🧠 Begründung: ${a.begruendung}` : ""}`).join("\n\n");

  const prompt = `--- GPT-PROMPT ---\n${systemVorlage}\n\n${blocks}`;
  navigator.clipboard.writeText(prompt);
  alert("Prompt in Zwischenablage kopiert!");
}

window.generierePrompt = generierePrompt;
window.addEventListener("DOMContentLoaded", ladeArtikel);
