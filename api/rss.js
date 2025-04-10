import { createClient } from '@supabase/supabase-js';

// Supabase Service Key (⚠️ nicht den "anon"-Key verwenden!)
const supabase = createClient(
  'https://fwqzalxpezqdkplgudix.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3cXphbHhwZXpxZGtwbGd1ZGl4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDI4NTUwMywiZXhwIjoyMDU5ODYxNTAzfQ.U-w5Nye44FALf8aH2VDMrVaJ_wsIJ4cyimhp_nGU07o' // 🛑 diesen Schlüssel bitte ersetzen
);

export default async function handler(req, res) {
  const feedUrl = "https://www.radioemscherlippe.de/thema/lokalnachrichten-447.rss";

  try {
    const feedResponse = await fetch(feedUrl);
    const feedText = await feedResponse.text();

    const parser = new DOMParser();
    const xml = parser.parseFromString(feedText, "application/xml");
    const items = Array.from(xml.querySelectorAll("item"));

    let inserted = 0;

    for (const item of items) {
      const title = item.querySelector("title")?.textContent;
      const link = item.querySelector("link")?.textContent;

      // Titel oder Link fehlen → überspringen
      if (!title || !link) continue;

      // Prüfen, ob Artikel schon existiert
      const { data: exists } = await supabase
        .from("artikel")
        .select("id")
        .eq("titel", title)
        .maybeSingle();

      if (!exists) {
        const volltext = await scrapeVolltext(link);

        await supabase.from("artikel").insert({
          titel: title,
          volltext,
          ausgewählt: false,
          hintergrund: false,
          begründung_hintergrund: "",
          rolle: "",
          format: "Mittagsupdate",
          autor: ""
        });

        inserted++;
      }
    }

    return res.status(200).json({ inserted });

  } catch (error) {
    console.error("❌ Fehler beim Abrufen des Feeds:", error);
    return res.status(500).json({ error: "Feed konnte nicht geladen werden." });
  }
}

// 🧠 Einfache Scraper-Logik für Volltext
async function scrapeVolltext(url) {
  try {
    const response = await fetch(url);
    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, "text/html");

    // Emscher-Lippe-Artikel: Absätze stehen im Inhaltsbereich
    const paragraphs = Array.from(doc.querySelectorAll("p"))
      .map(p => p.textContent.trim())
      .filter(Boolean);

    return paragraphs.join("\n\n").slice(0, 8000); // max Länge Supabase Text
  } catch (err) {
    console.error("⚠️ Fehler beim Scrapen:", err);
    return "❌ Volltext konnte nicht geladen werden.";
  }
}
