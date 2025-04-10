import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const templatePath = path.resolve('./api/promptvorlage.txt');
  const vorlage = fs.readFileSync(templatePath, 'utf-8');

  const { data } = await supabase
    .from("artikel")
    .select("*")
    .eq("ausgewählt", true)
    .order("zeitstempel", { ascending: false });

  const teile = data.map(d => `### ${d.titel}
${d.volltext.trim()}`).join("

");

  const prompt = `${vorlage}

${teile}`;
  res.status(200).send(prompt);
}