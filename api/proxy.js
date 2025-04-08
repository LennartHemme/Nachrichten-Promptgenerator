
export default async function handler(req, res) {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).send("Missing URL");

  try {
    const response = await fetch(decodeURIComponent(targetUrl));
    const contentType = response.headers.get("content-type");

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", contentType);
    const data = await response.text();
    res.status(200).send(data);
  } catch (error) {
    res.status(500).send("Error: " + error.toString());
  }
}
