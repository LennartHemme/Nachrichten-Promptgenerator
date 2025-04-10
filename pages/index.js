
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Home() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [promptText, setPromptText] = useState('');

  useEffect(() => {
    async function fetchArticles() {
      const { data, error } = await supabase
        .from('artikel')
        .select('*')
        .gte('zeitstempel', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('zeitstempel', { ascending: false });

      if (!error) setArticles(data);
      setLoading(false);
    }

    async function fetchPrompt() {
      const res = await fetch('/prompt.txt');
      const text = await res.text();
      setPromptText(text);
    }

    fetchArticles();
    fetchPrompt();
  }, []);

  return (
    <main>
      <h1>🗞️ Mittagsupdate-Promptgenerator</h1>
      <h2>📰 Artikelübersicht</h2>

      {loading ? (
        <p>⏳ Lade Artikel...</p>
      ) : (
        <div className="artikel-liste">
          {articles.map((a) => (
            <div className="card" key={a.id}>
              <h3>{a.titel}</h3>
              <p>{a.beschreibung}</p>
              <small>📅 {new Date(a.zeitstempel).toLocaleString()}</small><br />
              <a href={a.link} target="_blank" rel="noopener noreferrer">🔗 Zum Artikel</a>
            </div>
          ))}
        </div>
      )}

      <h2>🎯 Prompt-Vorschau</h2>
      <pre>{promptText}</pre>
    </main>
  );
}
