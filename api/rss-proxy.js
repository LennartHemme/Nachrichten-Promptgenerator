import { parseStringPromise } from 'xml2js';

export default async function handler(req, res) {
  try {
    const rssUrl = "https://www.radioemscherlippe.de/thema/lokalnachrichten-447.rss";
    const response = await fetch(rssUrl);
    const xml = await response.text();

    const parsed = await parseStringPromise(xml);
    const items = parsed.rss.channel[0].item;

    const articles = items.map((item, i) => ({
      id: i + 1,
      titel: item.title[0],
      link: item.link[0],
      text: (item.description?.[0] || '').replace(/(<([^>]+)>)/gi, '').trim()
    }));

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(200).json(articles.slice(0, 10)); // max. 10 Artikel
  } catch (err) {
    res.status(500).json({ error: "Feed konnte nicht geladen werden", details: err.toString() });
  }
}
