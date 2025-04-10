import { xml2json } from 'xml-js';

export default async function handler(req, res) {
  const rssUrl = "https://www.radioemscherlippe.de/thema/lokalnachrichten-447.rss";
  const supabaseUrl = "https://fwqzalxpezqdkplgudix.supabase.co/rest/v1/artikel";
  const serviceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3cXphbHhwZXpxZGtwbGd1ZGl4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDI4NTUwMywiZXhwIjoyMDU5ODYxNTAzfQ.U-w5Nye44FALf8aH2VDMrVaJ_wsIJ4cyimhp_nGU07o"; // Bitte deinen Service Role Key einsetzen

  try {
    // 1) Feed laden und parsen
    const rssResponse = await fetch(rssUrl);
    const rssText = await rssResponse.text();
    const feed = JSON.parse(xml2json(rssText, { compact: true }));

    const items = feed.rss?.channel?.item || [];
    // 2) Nur letzte 24h
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const recent = items.filter(it => {
      const raw = it.pubDate?._text?.trim();
      if (!raw) return false;
      return new Date(raw).getTime() >= cutoff;
    });
    // 3) Sortieren nach Datum desc
    recent.sort((a, b) =>
      new Date(b.pubDate?._text.trim()) - new Date(a.pubDate?._text.trim())
    );

    // 4) Speichern
    let inserted = 0;
    for (const it of recent) {
      const title = it.title?._cdata || it.title?._text || "";
      const desc = it.description?._cdata || it.description?._text || "";
      const link = it.link?._text || "";
      const pubDateRaw = it.pubDate?._text?.trim();
      const zeitstempel = pubDateRaw ? new Date(pubDateRaw).toISOString() : new Date().toISOString();

      if (!title || !link) continue; // Filter

      // Insert in Supabase
      const ins = await fetch(supabaseUrl, {
        method: "POST",
        headers: {
          apikey: serviceKey,
          Authorization: "Bearer " + serviceKey,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates"
        },
        body: JSON.stringify({
          titel: title,
          beschreibung: desc,
          volltext: "",
          ausgewählt: false,
          hintergrund: false,
          begründung_hintergrund: "",
          rolle: "",
          format: "Mittagsupdate",
          autor: "",
          zeitstempel
        })
      });
      if (ins.ok) inserted++;
    }

    res.status(200).json({ inserted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
