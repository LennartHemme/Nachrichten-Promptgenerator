// /api/prompt.js
import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { artikelIds } = req.body;
  if (!artikelIds || !Array.isArray(artikelIds) || artikelIds.length === 0) {
    return res.status(400).json({ error: 'Ungültige Anfrage' });
  }

  const { data, error } = await supabase
    .from('artikel')
    .select('*')
    .in('id', artikelIds);

  if (error) {
    return res.status(500).json({ error: 'Fehler beim Laden der Artikel' });
  }

  const promptPath = path.join(process.cwd(), 'data', 'prompt.txt');
  const systemPrompt = await fs.readFile(promptPath, 'utf-8');

  let artikelPrompt = data.map((a, i) => {
    const begruendung = a.begruendung_hintergrund ? `\nBegründung: ${a.begruendung_hintergrund}` : '';
    return `Artikel ${i + 1}: ${a.titel}\n${a.volltext}${begruendung}`;
  }).join('\n\n');

  const finalPrompt = `${systemPrompt}\n\n${artikelPrompt}`;

  res.status(200).json({ prompt: finalPrompt });
}
