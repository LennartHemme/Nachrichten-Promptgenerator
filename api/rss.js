import { xml2json } from 'xml-js';

export default async function handler(req, res) {
  const rssUrl = "https://www.radioemscherlippe.de/thema/lokalnachrichten-447.rss";
  const supabaseUrl = "https://fwqzalxpezqdkplgudix.supabase.co/rest/v1/artikel";
  const serviceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3cXphbHhwZXpxZGtwbGd1ZGl4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDI4NTUwMywiZXhwIjoyMDU5ODYxNTAzfQ.U-w5Nye44FALf8aH2VDMrVaJ_wsIJ4cyimhp_nGU07o"; // Ersetze diesen Platzhalter durch deinen vollständigen Service Role Key

  try {
    // RSS-Feed abrufen
    const rssResponse = await fetch(rssUrl);
    const rssText = await rssResponse.text();

    // XML in JSON umwandeln
    const feed = JSON.parse(xml2json(rssText, { compact: true }));

    const items = feed.rss?.channel?.item;
    if (!items || !Array.isArray(items)) {
      return res.status(200).json({ error: "Keine Artikel gefunden" });
    }

    // Filter: Nur Artikel aus den letzten 24 Stunden berücksichtigen
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const recentItems = items.filter(item => {
      const pubDateRaw = item.pubDate?._text?.trim();
      if (!pubDateRaw) return false;
      const pubDate = new Date(pubDateRaw).getTime();
      return pubDate >= cutoff;
    });

    // Sortiere nach Datum absteigend (neueste zuerst)
    recentItems.sort((a, b) => 
      new Date(b.pubDate._text.trim()) - new Date(a.pubDate._text.trim())
    );

    let inserted = 0;
    for (const item of recentItems) {
      const title = item.title?._cdata || item.title?._text || "";
      const link = item.link?._text || "";
      const description = item.description?._cdata || item.description?._text || "";
      const pubDateRaw = item.pubDate?._text.trim() || "";
      const zeitstempel = pubDateRaw ? new Date(pubDateRaw).toISOString() : new Date().toISOString();

      if (!title || !link) continue; // Überspringe Artikel ohne Titel oder Link

      // INSERT in Supabase via REST-API
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
          beschreibung: description,
          volltext: "wird nachgeladen...",  // Falls du später einen Volltext-Scraper einbaust
          ausgewählt: false,
          hintergrund: false,
          begründung_hintergrund: "",
          rolle: "",
          format: "Mittagsupdate",
          autor: "",
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
