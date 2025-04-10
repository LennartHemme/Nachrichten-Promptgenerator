import { xml2json } from 'xml-js';

export default async function handler(req, res) {
  const rssUrl = "https://www.radioemscherlippe.de/thema/lokalnachrichten-447.rss";
  const supabaseUrl = "https://fwqzalxpezqdkplgudix.supabase.co/rest/v1/artikel";
  const serviceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3cXphbHhwZXpxZGtwbGd1ZGl4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDI4NTUwMywiZXhwIjoyMDU5ODYxNTAzfQ.U-w5Nye44FALf8aH2VDMrVaJ_wsIJ4cyimhp_nGU07o"
  // ⬆️ Hier deinen vollständigen Service Role Key einsetzen, falls gekürzt.

  try {
    const rssResponse = await fetch(rssUrl);
    const rssText = await rssResponse.text();
    const feed = JSON.parse(xml2json(rssText, { compact: true }));

    const items = feed.rss?.channel?.item;
    if (!items || !Array.isArray(items)) {
      return res.status(200).json({ error: "Keine Artikel gefunden" });
    }

    // Artikel korrekt nach Datum absteigend sortieren
    items.sort((a, b) => new Date(b.pubDate._text) - new Date(a.pubDate._text));

    let inserted = 0;

    for (const item of items.slice(0, 20)) {
      const title = item.title?._cdata || item.title?._text;
      const link = item.link?._text;
      const description = item.description?._cdata || item.description?._text || "";
      const pubDateRaw = item.pubDate?._text;
      const zeitstempel = pubDateRaw ? new Date(pubDateRaw).toISOString() : new Date().toISOString();

      if (!title || !link) continue;

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
          volltext: "wird nachgeladen...",
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

    return res.status(200).json({ inserted });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
