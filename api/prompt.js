// /api/prompt.js
import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { artikel, hintergrund, autor, begruendung } = await req.json();

  const ids = artikel.filter(Boolean);
  if (!ids.length) return res.status(400).json({ error: 'Keine Artikel ausgewählt' });

  const { data, error } = await supabase
    .from('artikel')
    .select('*')
    .in('id', ids);

  if (error) return res.status(500).json({ error });

  const vorlage = await fs.readFile('prompt-vorlage.txt', 'utf-8');

  let prompt = `${vorlage.trim()}

---

`;

  data.forEach((a, i) => {
    const nummer = i + 1;
    prompt += `Artikel ${nummer}:
Titel: ${a.titel}
Teaser: ${a.beschreibung}
Volltext: ${a.volltext}

`;
  });

  if (hintergrund) {
    const hg = data.find(d => d.id === hintergrund);
    if (hg) {
      prompt += `Hintergrundstück:
Titel: ${hg.titel}
Teaser: ${hg.beschreibung}
Volltext: ${hg.volltext}
`; 
      if (begruendung) prompt += `Begründung: ${begruendung}
`;
    }
  }

  prompt += `
Autor: ${autor}`;

  res.status(200).json({ prompt });
}
