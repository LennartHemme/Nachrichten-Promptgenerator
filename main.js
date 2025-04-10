import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
  'https://fwqzalxpezqdkplgudix.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3cXphbHhwZXpxZGtwbGd1ZGl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQyODU1MDMsImV4cCI6MjA1OTg2MTUwM30.XIAIYCUzNxvRM9R-S3uLLz-XPUC8i7jWSWmhwyWyi4A'
);

// 🔄 Lade Artikel aus Supabase und zeige sie an
async function ladeArtikel() {
  const appDiv = document.getElementById("app");
  appDiv.innerHTML = ""; // vorherigen Inhalt löschen

  const { data, error } = await supabase
    .from("artikel")
    .select("*")
    .order("zeitstempel", { ascending: false });

  if (error) {
    appDiv.innerHTML = "<p>❌ Fehler beim Laden der Artikel.</p>";
    console.error("❌ Fehler beim Abrufen:", error);
    return;
  }

  if (!data || data.length === 0) {
    appDiv.innerHTML = "<p>Keine Artikel gefunden.</p>";
    return;
  }

  data.forEach((artikel) => {
    const articleDiv = document.createElement("div");
    articleDiv.classList.add("artikel");

    articleDiv.innerHTML = `
      <h3>${artikel.titel}</h3>

      <label>
        <input type="checkbox" ${artikel.ausgewählt ? "checked" : ""} disabled />
        Ausgewählt
      </label><br>

      <label>
        <input type="checkbox" ${artikel.hintergrund ? "checked" : ""} disabled />
        Hintergrundstück
      </label><br>

      ${artikel.hintergrund && artikel.begründung_hintergrund ? `
        <label><strong>Begründung:</strong><br>
          <textarea disabled>${artikel.begründung_hintergrund}</textarea>
        </label>
      ` : ""}
    `;

    appDiv.appendChild(articleDiv);
  });
}

// 📰 RSS-Feed über eigene Proxy-API laden
async function ladeRSSFeed() {
  const feedUrl = 'https://www1.wdr.de/nachrichten/rss/nrwkompakt102-rss.xml'; // Beispiel-Feed
  const proxyUrl = `/api/proxy?url=${encodeURIComponent(feedUrl)}`;

  try {
    const response = await fetch(proxyUrl);
    const feedText = await response.text();

    const parser = new DOMParser();
    const xml = parser.parseFromString(feedText, "application/xml");
    const items = xml.querySelectorAll("item");

    console.log(`📰 ${items.length} Artikel aus RSS geladen:`);

    items.forEach(item => {
      const title = item.querySelector("title")?.textContent;
      const link = item.querySelector("link")?.textContent;
      console.log("🔗", title, link);
    });

  } catch (err) {
    console.error("❌ Fehler beim Laden des RSS-Feeds:", err);
  }
}

// 🔁 Beide beim Start ausführen
ladeArtikel();
ladeRSSFeed();
