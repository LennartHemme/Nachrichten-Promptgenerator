export default async function handler(req, res) {
  const rssUrl = "https://www.radioemscherlippe.de/thema/lokalnachrichten-447.rss";
  try {
    const xml = await fetch(rssUrl).then(r => r.text());
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)];
    const data = items.map(item => {
      const title = item[1].match(/<title>(.*?)<\/title>/)?.[1] ?? "";
      const link = item[1].match(/<link>(.*?)<\/link>/)?.[1] ?? "";
      const desc = item[1].match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1].replace(/<[^>]+>/g, '') ?? "";
      return { titel: title, link, text: desc };
    }).filter(a => a.titel && a.text);
    res.status(200).json(data.slice(0, 6));
  } catch (err) {
    res.status(500).send("Fehler beim Parsen des RSS-Feeds.");
  }
}
