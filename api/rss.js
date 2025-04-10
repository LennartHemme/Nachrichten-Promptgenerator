import Parser from 'rss-parser';

const parser = new Parser();

export default async function handler(req, res) {
  try {
    // RSS-Feed von Radio Emscher Lippe laden
    const feed = await parser.parseURL('https://www.radioemscherlippe.de/thema/lokalnachrichten-447.rss');

    // Artikel verarbeiten: pubDate wird in lesbares deutsches Datum umgewandelt und als rawDate für die Sortierung gespeichert
    const articles = feed.items.map(item => {
      const rawDate = new Date(item.pubDate);
      return {
        title: item.title,
        link: item.link,
        description: item.contentSnippet || item.description || "",
        pubDate: rawDate.toLocaleString('de-DE', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        rawDate: rawDate.getTime()
      };
    });

    // Absteigend sortieren – neueste Artikel zuerst
    articles.sort((a, b) => b.rawDate - a.rawDate);

    res.status(200).json(articles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
