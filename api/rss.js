// Datei: /api/rss.js
import { createClient } from '@supabase/supabase-js';
import Parser from 'rss-parser';
import fetch from 'node-fetch';

const supabase = createClient(
  'https://fwqzalxpezqdkplgudix.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3cXphbHhwZXpxZGtwbGd1ZGl4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDI4NTUwMywiZXhwIjoyMDU5ODYxNTAzfQ.U-w5Nye44FALf8aH2VDMrVaJ_wsIJ4cyimhp_nGU07o'
);

const parser = new Parser();

async function getFullTextFromLink(link) {
  try {
    const res = await fetch(link);
    const html = await res.text();
    const match = html.match(/<div class="article-text">([\s\S]+?)<\/div>/);
    if (match) {
      return match[1].replace(/<[^>]*>/g, '').trim();
    }
  } catch (e) {
    console.error('Scraping-Fehler:', e);
  }
  return '';
}

export default async function handler(req, res) {
  const feed = await parser.parseURL('https://www.radioemscherlippe.de/thema/lokalnachrichten-447.rss');
  const seitGestern = new Date(Date.now() - 24 * 60 * 60 * 1000);
  let inserted = [];

  for (const entry of feed.items) {
    const pubDate = new Date(entry.pubDate);
    if (pubDate < seitGestern) continue;

    const { data: vorhanden } = await supabase
      .from('artikel')
      .select('id')
      .eq('titel', entry.title)
      .maybeSingle();

    if (!vorhanden) {
      const volltext = await getFullTextFromLink(entry.link);
      const { data, error } = await supabase.from('artikel').insert([
        {
          titel: entry.title,
          beschreibung: entry.contentSnippet,
          zeitstempel: pubDate.toISOString(),
          volltext,
          link: entry.link
        }
      ]);
      if (!error && data) inserted.push(data[0]);
    }
  }

  res.status(200).json({ inserted });
}
