import { createClient } from '@supabase/supabase-js';
import Parser from 'rss-parser';

const parser = new Parser();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const feed = await parser.parseURL("https://www.radioemscherlippe.de/thema/lokalnachrichten-447.rss");

  let inserted = 0;

  for (const item of feed.items) {
    const exists = await supabase
      .from("artikel")
      .select("id")
      .eq("titel", item.title)
      .maybeSingle();

    if (exists.data) continue;

    const diffResponse = await fetch(`https://api.diffbot.com/v3/article?token=${process.env.DIFFBOT_TOKEN}&url=${encodeURIComponent(item.link)}`);
    const diffJson = await diffResponse.json();
    const volltext = diffJson?.objects?.[0]?.text || '';

    await supabase.from("artikel").insert([{
      titel: item.title,
      beschreibung: item.contentSnippet,
      zeitstempel: new Date(item.pubDate).toISOString(),
      volltext,
      link: item.link
    }]);

    inserted++;
  }

  res.status(200).json({ inserted });
}
