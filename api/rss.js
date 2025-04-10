import { xml2json } from 'xml-js';

export default async function handler(req, res) {
  const rssUrl = "https://www.radioemscherlippe.de/thema/lokalnachrichten-447.rss";
  const supabaseUrl = "https://fwqzalxpezqdkplgudix.supabase.co/rest/v1/artikel";
  const serviceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3cXphbHhwZXpxZGtwbGd1ZGl4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDI4NTUwMywiZXhwIjoyMDU5ODYxNTAzfQ.U-w5Nye44FALf8aH2VDMrVaJ_wsIJ4cyimhp_nGU07o"; // Ersetze diesen Platzhalter durch deinen vollständigen Service Role Key

  try {
    const rssResponse = await fetch(rssUrl);
    const rssText = await rssResponse.text();
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
      const pubDate = new Date(pubDateRaw).getTime();
      return pubDate >= cutoff;
    });

    // Sortieren: Neueste Artikel zuerst
    recentItems.sort((a, b) => 
      new Date(b.pubDate._text.trim()) - new Date(a.pubDate._text.trim())
    );

    // Bereite Artikel vor, inklusive Formatierung des Datums
    const articles = recentItems.map(item => {
      const pubDateRaw = item.pubDate?._text.trim();
      const pubDateObj = new Date(pubDateRaw);
      const formattedDate = pubDateObj.toLocaleString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
      return {
        titel: item.title?._cdata || item.title?._text || "",
        beschreibung: item.description?._cdata || item.description?._text || "",
        link: item.link?._text || "",
        zeitstempel: pubDateObj.toISOString(),
        pubDateFormatted: formattedDate
      };
    });

    // Insert: Füge Artikel in Supabase ein
    let inserted = 0;
    for (const art of articles) {
      if (!art.titel || !art.link) continue;
      const insertRes = await fetch(supabaseUrl, {
        method: 'POST',
        headers: {
          apikey: serviceKey,
          Authorization: 'Bearer ' + serviceKey,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          titel: art.titel,
          beschreibung: art.beschreibung,
          volltext: "wird nachgeladen...", // Platzhalter für späteren Volltext-Scraper
          ausgewählt: false,
          hintergrund: false,
          begründung_hintergrund: "",
          rolle: "",
          format: "Mittagsupdate",
          autor: "",
          zeitstempel: art.zeitstempel
        })
      });
      if (insertRes.ok) {
        inserted++;
      }
    }

    return res.status(200).json({ inserted, articles });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
