export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'No URL provided' });
  }

  try {
    const response = await fetch(url);
    const data = await response.text();
    res.setHeader('Content-Type', 'text/xml');
    return res.status(200).send(data);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch URL' });
  }
}
