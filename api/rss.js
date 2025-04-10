import { xml2json } from 'xml-js';

export default async function handler(req, res) {
  const rssUrl = "https://www.radioemscherlippe.de/thema/lokalnachrichten-447.rss";
  const supabaseUrl = "https://fwqzalxpezqdkplgudix.supabase.co/rest/v1/artikel";
  const serviceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3cXphbHhwZXpxZGtwbGd1ZGl4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDI4NTUwMywiZXhwIjoyMDU5ODYxNTAzfQ.U-w5Nye44FALf8aH2VDMrVaJ_wsIJ4cyimhp_nGU07o"; // Hier einsetzen!

  try {
    const rssResponse = await fetch(rssUrl);
    const rssText = await rssResponse.text();
    const feed = JSON.parse(xml2json(rssText, { compact: true }));

    const items = feed.rss.channel.item;
    if (!items || !Array.isArray(items)) {
      return res.status(200).json({ error: "Keine Artikel gefunden" });
    }

    // RSS-Datumsformat korrekt parsen und sortieren
    items.sort((a, b) => new Date(b.pubDate._text.trim()) - new Date(a.pubDate._text.trim()));

    const artikel = items.slice(0, 20).map(item => ({
      titel: item.title._text || item.title._cdata || "",
      teaser: item.description._text || item.description._cdata || "",
      datum: new Date(item.pubDate._text.trim()).toISOString(),
      link: item.link._text || "",
    }));

    // Optionaler Insert nach Supabase (kannst du entfernen, wenn unnötig)
    for (const art of artikel) {
      await fetch(supabaseUrl, {
        method: 'POST',
        headers: {
          apikey: serviceKey,
          Authorization: 'Bearer ' + serviceKey,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          titel: art.titel,
          beschreibung: art.teaser,
          volltext: "wird nachgeladen...",
          ausgewählt: false,
          hintergrund: false,
          begründung_hintergrund: "",
          rolle: "",
          format: "Mittagsupdate",
          autor: "",
          zeitstempel: art.datum
        })
      });
    }

    res.status(200).json(artikel);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
