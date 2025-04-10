
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const feedUrl = 'https://www.radioemscherlippe.de/thema/lokalnachrichten-447.rss';
  const xml = await fetch(feedUrl).then(r => r.text());
  const items = Array.from(xml.matchAll(/<item>([\s\S]*?)<\/item>/g)).map(match => {
    const itemXml = match[1];
    const getTag = (tag) => {
      const result = itemXml.match(new RegExp(`<${tag}>([\s\S]*?)<\/${tag}>`));
      return result ? result[1].trim() : '';
    };
    return {
      titel: getTag('title'),
      beschreibung: getTag('description'),
      zeitstempel: new Date(getTag('pubDate')).toISOString(),
      link: getTag('link'),
    };
  });

  const inserted = [];

  for (const item of items) {
    const { data, error } = await supabase
      .from('artikel')
      .select('id')
      .eq('titel', item.titel)
      .maybeSingle();

    if (!data && !error) {
      const fulltext = await fetch('https://diffbot-api-proxy.vercel.app/?url=' + encodeURIComponent(item.link))
        .then(r => r.json())
        .then(j => j.text || '');

      const insert = await supabase.from('artikel').insert({
        titel: item.titel,
        beschreibung: item.beschreibung,
        zeitstempel: item.zeitstempel,
        link: item.link,
        volltext: fulltext
      });

      if (!insert.error) inserted.push(item.titel);
    }
  }

  res.status(200).json({ inserted });
}
