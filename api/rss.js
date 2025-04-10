import { createClient } from '@supabase/supabase-js';
import Parser from 'rss-parser';

const parser = new Parser();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  try {
    const feed = await parser.parseURL("https://www.radioemscherlippe.de/thema/lokalnachrichten-447.rss");

    let inserted = 0;

    for (const item of feed.items) {
      // Prüfe, ob Artikel schon existiert
      const { data: existing, error: selectError } = await supabase
        .from("artikel")
        .select("id")
        .eq("titel", item.title)
        .maybeSingle();

      if (selectError) {
        console.error("❌ Fehler beim SELECT:", selectError.message);
        continue;
      }

      if (existing) continue;

      // Rufe Diffbot auf
      let volltext = '';
      try {
        const diffbotRes = await fetch(`https://api.diffbot.com/v3/article?token=${process.env.DIFFBOT_TOKEN}&url=${encodeURIComponent(item.link)}`);
        const diffJson = await diffbotRes.json();
        volltext = diffJson?.objects?.[0]?.text || '';
      } catch (err) {
        console.warn(`⚠️ Diffbot-Fehler bei Artikel "${item.title}":`, err.message);
      }

      const { error: insertError } = await supabase.from("artikel").insert([{
        titel: item.title,
        beschreibung: item.contentSnippet || '',
        zeitstempel: new Date(item.pubDate).toISOString(),
        volltext: volltext,
        link: item.link
      }]);

      if (!insertError) {
        inserted++;
      } else {
        console.error("❌ Fehler beim INSERT:", insertError.message);
      }
    }

    res.status(200).json({ inserted });
  } catch (e) {
    console.error("❌ Fehler im Handler:", e.message);
    res.status(500).json({ error: "Feed konnte nicht verarbeitet werden." });
  }
}
