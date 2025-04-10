import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio'; // funktioniert in Vercel Edge Functions (wenn installiert)

// Service Role Key verwenden (nicht den "anon"-Key!)
const supabase = createClient(
  'https://fwqzalxpezqdkplgudix.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3cXphbHhwZXpxZGtwbGd1ZGl4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDI4NTUwMywiZXhwIjoyMDU5ODYxNTAzfQ.U-w5Nye44FALf8aH2VDMrVaJ_wsIJ4cyimhp_nGU07o'
);

export default async function handler(req, res) {
  try {
    const rssUrl = "https://www.radioemscherlippe.de/thema/lokalnachrichten-447.rss";
    const rssResponse = await fetch(rssUrl);
    const rssText = await rssResponse.text();

    const items = Array.from(rssText.matchAll(/<item>(.*?)<\/item>/gs)).map(match => match[1]);
    let inserted = 0;

    for (const item of items) {
      const titleMatch = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/);
      const linkMatch = item.match(/<link>(.*?)<\/link>/);

      if (!titleMatch || !linkMatch) continue;

      const title = titleMatch[1];
      const link = linkMatch[1];

      // Prüfen, ob Artikel bereits vorhanden
      const { data: exists } = await supabase
        .from("artikel")
        .select("id")
        .eq("titel", title)
        .maybeSingle();

      if (exists) continue;

      // Volltext scrapen
      const volltext = await scrapeVolltext(link);

      // In Supabase einfügen
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
    return res.status(500).json({ error: "Interner Fehler beim RSS-Import" });
  }
}

async function scrapeVolltext(url) {
  try {
    const response = await fetch(url);
    const html = await response.text();

    const matchStart = html.indexOf('<div class="text">');
    const matchEnd = html.indexOf('<div class="articlefunctions">');

    if (matchStart === -1 || matchEnd === -1 || matchEnd <= matchStart) return "";

    const content = html.slice(matchStart, matchEnd);
    const clean = content.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

    return clean.slice(0, 8000);
  } catch (err) {
    return "❌ Volltext konnte nicht geladen werden.";
  }
}
