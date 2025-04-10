import { createClient } from '@supabase/supabase-js';
import https from 'https';

// 🛑 Ersetze das mit deinem echten Service Role Key!
const supabase = createClient(
  'https://fwqzalxpezqdkplgudix.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3cXphbHhwZXpxZGtwbGd1ZGl4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDI4NTUwMywiZXhwIjoyMDU5ODYxNTAzfQ.U-w5Nye44FALf8aH2VDMrVaJ_wsIJ4cyimhp_nGU07o'
);

export default async function handler(req, res) {
  try {
    const feedUrl = "https://www.radioemscherlippe.de/thema/lokalnachrichten-447.rss";
    const feedText = await fetchText(feedUrl);
    const items = [...feedText.matchAll(/<item>(.*?)<\/item>/gs)].map(m => m[1]);

    let inserted = 0;

    for (const item of items) {
      const titleMatch = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/);
      const linkMatch = item.match(/<link>(.*?)<\/link>/);

      if (!titleMatch || !linkMatch) continue;

      const title = titleMatch[1];
      const link = linkMatch[1];

      const { data: existing } = await supabase
        .from("artikel")
        .select("id")
        .eq("titel", title)
        .maybeSingle();

      if (existing) continue;

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

    return res.status(200).json({ inserted });
  } catch (err) {
    console.error("❌ Fehler beim RSS-Import:", err);
    return res.status(500).json({ error: "RSS-Verarbeitung fehlgeschlagen" });
  }
}

async function fetchText(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = "";
      res.on("data", chunk => (data += chunk));
      res.on("end", () => resolve(data));
    }).on("error", reject);
  });
}

async function scrapeVolltext(url) {
  try {
    const html = await fetchText(url);
    const content = html.split('<div class="text">')[1]?.split('<div class="articlefunctions">')[0];
    const clean = content?.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim() || "";

    return clean.slice(0, 8000);
  } catch (err) {
    return "❌ Volltext konnte nicht geladen werden.";
  }
}
