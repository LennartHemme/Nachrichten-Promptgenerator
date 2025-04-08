export default function handler(req, res) {
  const vorlage = `Bitte schreibe ein kurzes Radioupdate anhand der gewählten Artikel. Achte darauf, dass es einen roten Faden gibt und der Moderator informiert und freundlich klingt. Nutze gerne Alltagssprache.`;
  res.status(200).send(vorlage);
}
