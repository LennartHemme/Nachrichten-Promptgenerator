import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
  'https://fwqzalxpezqdkplgudix.supabase.co',
  '', // Wird aus ENV geladen
);

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

  if (!data.length) {
    app.innerHTML = "⚠️ Keine Artikel gefunden.";
    return;
  }

  app.innerHTML = "";
  data.forEach(a => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <h3>${a.titel}</h3>
      <p>${a.beschreibung}</p>
      <small>${new Date(a.zeitstempel).toLocaleString()}</small>
    `;
    app.appendChild(card);
  });
}

document.getElementById("updateBtn").addEventListener("click", async () => {
  await fetch("/api/rss");
  ladeArtikel();
});
document.getElementById("promptBtn").addEventListener("click", async () => {
  const res = await fetch("/api/prompt");
  const txt = await res.text();
  alert(txt);
});

ladeArtikel();