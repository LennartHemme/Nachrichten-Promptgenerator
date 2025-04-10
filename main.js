import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
  'https://fwqzalxpezqdkplgudix.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...07o' // Service Role Key
);

const DIFFBOT_TOKEN = "a44151a8f5b98c309fa94bf8b28d35bf";

async function ladeArtikel() {
  const app = document.getElementById("app");
  app.innerHTML = "⏳ Lade Artikel...";

  const { data, error } = await supabase
    .from("artikel")
    .select("*")
    .order("zeitstempel", { ascending: false });

  if (error) {
    console.error(error);
    app.innerHTML = "❌ Fehler beim Laden.";
    return;
  }

  app.innerHTML = "";
  data.forEach(async a => {
    if (!a.volltext && a.link) {
      const scraped = await fetch(`https://api.diffbot.com/v3/article?token=${DIFFBOT_TOKEN}&url=${encodeURIComponent(a.link)}`);
      const result = await scraped.json();
      const volltext = result.objects?.[0]?.text || "";
      await supabase.from("artikel").update({ volltext }).eq("id", a.id);
      a.volltext = volltext;
    }

    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <h3>${a.titel}</h3>
      <p>${a.beschreibung || "Kein Beschreibungstext vorhanden."}</p>
      <small>📅 ${new Date(a.zeitstempel).toLocaleString()}</small><br/>
      <a href="${a.link}" target="_blank">🔗 Zum Artikel</a><br/>
      <button onclick='zeigePrompt(${JSON.stringify(a)})'>🎙️ Prompt anzeigen</button>
    `;
    app.appendChild(card);
  });
}

async function zeigePrompt(a) {
  const response = await fetch("promptvorlage.txt");
  const template = await response.text();
  const prompt = template + "\n\n" + a.volltext;
  document.getElementById("promptPreview").textContent = prompt;
}

ladeArtikel();