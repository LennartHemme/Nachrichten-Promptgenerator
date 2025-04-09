import { JSDOM } from "jsdom";

export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "Kein URL-Parameter angegeben." });

  try {
    const response = await fetch(decodeURIComponent(url));
    const html = await response.text();
    const dom = new JSDOM(html);
    const paragraphs = [...dom.window.document.querySelectorAll("p, li")]
      .map(el => el.textContent.trim())
      .filter(t => t.length > 40 && t.split(" ").length > 5);

    const result = paragraphs.join("\n\n").substring(0, 6000);
    res.status(200).json({ text: result || "Kein sinnvoller Text gefunden" });
  } catch (err) {
    res.status(500).json({ error: "Scrape-Fehler: " + err.message });
  }
}
