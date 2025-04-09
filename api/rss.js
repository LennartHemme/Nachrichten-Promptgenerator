export default async function handler(req, res) {
  const rssUrl = "https://www.radioemscherlippe.de/thema/lokalnachrichten-447.rss";
  try {
    const response = await fetch(rssUrl);
    const text = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "text/xml");
    const items = [...doc.querySelectorAll("item")];

    const daten = items.map(item => ({
      titel: item.querySelector("title")?.textContent ?? "",
      link: item.querySelector("link")?.textContent ?? "",
      datum: item.querySelector("pubDate")?.textContent ?? ""
    }));

    res.status(200).json(daten);
  } catch (error) {
    res.status(500).json({ error: "RSS-Fehler: " + error.message });
  }
}
