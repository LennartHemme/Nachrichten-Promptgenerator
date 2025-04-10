import { xml2json } from 'xml-js';

// Automatischer Volltext-Scraper – einfache Version
async function scrapeVolltext(link) {
  try {
    const pageRes = await fetch(link);
    const html = await pageRes.text();
    // Extrahiere sämtliche <p>-Inhalte als Volltext (einfache Methode)
    const paragraphs = html.match(/<p[^>]*>(.*?)<\/p>/gs) || [];
    const text = paragraphs.map(p => p.replace(/<[^>]+>/g, "").trim()).join("\n\n");
    return text.slice(0, 8000);
  } catch (err) {
    return "❌ Volltext konnte nicht geladen werden.";
  }
}

export default async function handler(req, res) {
  const rssUrl = "https://www.radioemscherlippe.de/thema/lokalnachrichten-447.rss";
  const supabaseUrl = "https://fwqzalxpezqdkplgudix.supabase.co/rest/v1/artikel";
  const serviceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3cXphbHhwZXpxZGtwbGd1ZGl4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDI4NTUwMywiZXhwIjoyMDU5ODYxNTAzfQ.U-w5Nye44FALf8aH2VDMrVaJ_wsIJ4cyimhp_nGU07o"; // Hier deinen vollständigen Service Role Key einfügen

  try {
    const rssResponse = await fetch(rssUrl);
    const rssText = await rssResponse.text();
    // Konvertiere XML in JSON
    const feed = JSON.parse(xml2json(rssText, { compact: true }));

    const items = feed.rss?.channel?.item;
    if (!items || !Array.isArray(items)) {
      return res.status(200).json({ error: "Keine Artikel gefunden" });
    }

    // Filter: Nur Artikel aus den letzten 24 Stunden
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const recentItems = items.filter(item => {
      const pubDateRaw = item.pubDate?._text?.trim();
      if (!pubDateRaw) return false;
      return new Date(pubDateRaw).getTime() >= cutoff;
    });

    // Sortiere nach Datum absteigend (neueste zuerst)
    recentItems.sort((a, b) =>
      new Date(b.pubDate._text.trim()) - new Date(a.pubDate._text.trim())
    );

    let inserted = 0;
    // Für jeden Artikel: Volltext automatisch ermitteln und in Supabase einfügen
    for (const item of recentItems) {
      const title = item.title?._cdata || item.title?._text || "";
      const desc = item.description?._cdata || item.description?._text || "";
      const link = item.link?._text || "";
      const pubDateRaw = item.pubDate?._text?.trim() || "";
      const zeitstempel = pubDateRaw ? new Date(pubDateRaw).toISOString() : new Date().toISOString();

      if (!title || !link) continue;

      // Automatischer Volltext-Scraper: Hole den Volltext vom Artikel-Link
      const volltext = await scrapeVolltext(link);

      // Insert in Supabase (ohne Felder "autor" und "format")
      const insertRes = await fetch(supabaseUrl, {
        method: 'POST',
        headers: {
          apikey: serviceKey,
          Authorization: 'Bearer ' + serviceKey,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          titel: title,
          beschreibung: desc,
          volltext: volltext,
          ausgewählt: false,
          hintergrund: false,
          begründung_hintergrund: "",
          rolle: "",
          // Feld "format" und "autor" entfallen
          zeitstempel: zeitstempel
        })
      });
      if (insertRes.ok) inserted++;
    }

    res.status(200).json({ inserted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
