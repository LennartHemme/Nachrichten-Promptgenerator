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
      const exists = await supabase
        .from("artikel")
        .select("id")
        .eq("titel", item.title)
        .maybeSingle();

      if (exists.data) continue;

      let volltext = "";
      try {
        const diffbot = await fetch(`https://api.diffbot.com/v3/article?token=${process.env.DIFFBOT_TOKEN}&url=${encodeURIComponent(item.link)}`);
        const diffJson = await diffbot.json();
        volltext = diffJson?.objects?.[0]?.text || '';
      } catch (err) {
        console.error("❌ Fehler beim Abrufen von Diffbot:", err.message);
      }

      const { error } = await supabase.from("artikel").insert([{
        titel: item.title,
        beschreibung: item.contentSnippet || '',
        zeitstempel: new Date(item.pubDate).toISOString(),
        volltext
      }]);

      if (error) {
        console.error("❌ Fehler beim Einfügen in Supabase:", error.message);
        continue;
      }

      inserted++;
    }

    res.status(200).json({ inserted });
  } catch (e) {
    console.error("❌ Genereller Fehler in /api/rss:", e.message);
    res.status(500).json({ error: e.message });
  }
}
