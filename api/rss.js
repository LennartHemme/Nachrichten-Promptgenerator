import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://fwqzalxpezqdkplgudix.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3cXphbHhwZXpxZGtwbGd1ZGl4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDI4NTUwMywiZXhwIjoyMDU5ODYxNTAzfQ.U-w5Nye44FALf8aH2VDMrVaJ_wsIJ4cyimhp_nGU07o' // ⚠️ NICHT dein "anon" key – sondern der SERVICE KEY
);

export default async function handler(req, res) {
  const feedUrl = "https://https://www.radioemscherlippe.de/thema/lokalnachrichten-447.rss";
  const response = await fetch(feedUrl);
  const xmlText = await response.text();
  const parser = new DOMParser();
  const xml = parser.parseFromString(xmlText, "application/xml");

  const items = Array.from(xml.querySelectorAll("item"));

  let inserted = 0;

  for (const item of items) {
    const title = item.querySelector("title")?.textContent;
    const link = item.querySelector("link")?.textContent;

    // Check, ob Artikel schon existiert
    const { data: existing } = await supabase
      .from("artikel")
      .select("id")
      .eq("titel", title)
      .maybeSingle();

    if (!existing) {
      // Scraper aufrufen
      const volltext = await getVolltext(link);

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
  }

  res.status(200).json({ inserted });
}

async function getVolltext(url) {
  try {
    const response = await fetch(url);
    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, "text/html");

    const pTags = Array.from(doc.querySelectorAll("p"));
    const text = pTags.map(p => p.textContent.trim()).join("\n\n");

    return text.slice(0, 8000); // Limit wegen Supabase max. Feldgröße
  } catch (e) {
    return "❌ Volltext konnte nicht geladen werden.";
  }
}
