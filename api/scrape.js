export default async function handler(req, res) {
  try {
    const { link, id } = req.query; // z.B. /api/scrape?link=...&id=...
    if (!link || !id) {
      return res.status(400).json({ error: "link und id nötig" });
    }

    // HINWEIS: Ggf. externen Proxy nutzen, falls CORS blockiert.
    const page = await fetch(link);
    const html = await page.text();

    // Kurzes, simples Parsing: wir holen alle <p>-Tags
    // => In echt bitte robuster machen (z.B. "jsdom", "cheerio" etc.)
    const paragraphs = html.match(/<p[^>]*>(.*?)<\/p>/gs) || [];
    let text = paragraphs.map(p => p.replace(/<[^>]+>/g, "").trim()).join("\n\n");
    if (text.length > 10000) {
      text = text.slice(0, 9999);
    }

    // In Supabase speichern
    const supabaseUrl = "https://fwqzalxpezqdkplgudix.supabase.co/rest/v1/artikel";
    const serviceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3cXphbHhwZXpxZGtwbGd1ZGl4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDI4NTUwMywiZXhwIjoyMDU5ODYxNTAzfQ.U-w5Nye44FALf8aH2VDMrVaJ_wsIJ4cyimhp_nGU07o";

    const update = await fetch(`${supabaseUrl}?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: {
        apikey: serviceKey,
        Authorization: "Bearer " + serviceKey,
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      },
      body: JSON.stringify({
        volltext: text
      })
    });

    if (!update.ok) {
      return res.status(500).json({ error: "Fehler beim Updaten in Supabase" });
    }

    res.status(200).json({ success: true, id, textPreview: text.slice(0, 100) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
