export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const feedUrl = "https://www.radioemscherlippe.de/thema/lokalnachrichten-447.rss";
  const supabaseUrl = "https://fwqzalxpezqdkplgudix.supabase.co/rest/v1/artikel";
  const serviceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3cXphbHhwZXpxZGtwbGd1ZGl4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDI4NTUwMywiZXhwIjoyMDU5ODYxNTAzfQ.U-w5Nye44FALf8aH2VDMrVaJ_wsIJ4cyimhp_nGU07o";

  try {
    const rssResponse = await fetch(feedUrl);
    const rssText = await rssResponse.text();
    const items = [...rssText.matchAll(/<item>(.*?)<\/item>/gs)].map(m => m[1]);

    let inserted = 0;

    for (const item of items.slice(0, 5)) {
      const titleMatch = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/);
      const linkMatch = item.match(/<link>(.*?)<\/link>/);

      if (!titleMatch || !linkMatch) continue;

      const title = titleMatch[1];
      const link = linkMatch[1];

      const insertResponse = await fetch(supabaseUrl, {
        method: 'POST',
        headers: {
          'apikey': serviceKey,
          'Authorization': 'Bearer ' + serviceKey,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          titel: title,
          volltext: "wird nachgeladen...",
          ausgewählt: false,
          hintergrund: false,
          begründung_hintergrund: "",
          rolle: "",
          format: "Mittagsupdate",
          autor: ""
        })
      });

      if (insertResponse.ok) inserted++;
    }

    return new Response(JSON.stringify({ inserted }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
