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
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const { artikelIds, hintergrundBegruendung, autorName } = req.body;
  if (!Array.isArray(artikelIds) || artikelIds.length < 1 || !autorName) {
    return res.status(400).json({ error: 'Fehlende Parameter' });
  }

  const { data, error } = await supabase
    .from('artikel')
    .select('titel, volltext')
    .in('id', artikelIds);

  if (error) return res.status(500).json({ error });

  let promptTemplate = await fs.readFile(path.resolve('./prompt.txt'), 'utf-8');

  let artikelTexte = '';
  data.forEach((a, i) => {
    artikelTexte += `Artikel ${i + 1}: ${a.titel}\n${a.volltext.trim()}\n\n`;
  });

  if (hintergrundBegruendung) {
    artikelTexte += `\nBegründung für Hintergrundstück: ${hintergrundBegruendung}\n`;
  }

  const finalPrompt = promptTemplate
    .replace('{{AUTOR}}', autorName)
    .replace('{{ARTIKEL}}', artikelTexte.trim());

  res.status(200).json({ prompt: finalPrompt });
}
