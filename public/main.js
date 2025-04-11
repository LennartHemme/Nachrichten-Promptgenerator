let supabase;

async function getConfig() {
  const res = await fetch('/api/config');
  return res.json();
}

async function ladeArtikel() {
  const app = document.getElementById("app");
  app.innerHTML = "⏳ Lade Artikel...";

  const seitGestern = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("artikel")
    .select("*")
    .gte("zeitstempel", seitGestern)
    .order("zeitstempel", { ascending: false });

  if (error) return app.innerHTML = "❌ Fehler beim Laden.";

  app.innerHTML = data.map(a => `
    <div class="card">
      <h3>${a.titel}</h3>
      <p>${a.beschreibung}</p>
      <a href="${a.link}" target="_blank">Artikel ansehen</a>
      <select data-id="${a.id}">
        <option>Nicht verwenden</option>
        <option>Artikel 1</option>
        <option>Artikel 2</option>
        <option>Artikel 3</option>
        <option>Artikel 4</option>
        <option>Hintergrundstück</option>
      </select>
      <textarea placeholder="Begründung (optional)" data-id="${a.id}"></textarea>
    </div>
  `).join('');
}

async function updateArticles() {
  document.getElementById("updateBtn").textContent = "⏳ Lade neue Artikel...";
  await fetch("/api/rss");
  await ladeArtikel();
  document.getElementById("updateBtn").textContent = "Artikel aktualisieren";
}

async function promptGenerieren() {
  const vorlage = await fetch('/api/promptvorlage.txt').then(r => r.text());
  const selected = Array.from(document.querySelectorAll("select"))
    .map(sel => ({
      id: sel.dataset.id,
      rolle: sel.value,
      begruendung: document.querySelector(`textarea[data-id="${sel.dataset.id}"]`).value
    }))
    .filter(sel => sel.rolle !== "Nicht verwenden");

  // Warnung bei doppelter Auswahl
  const rollen = selected.map(s => s.rolle).filter(r => r !== "Hintergrundstück");
  if (new Set(rollen).size !== rollen.length)
    return alert("❌ Rollen doppelt vergeben!");

  const artikelIds = selected.map(s => s.id);
  const { data } = await supabase.from("artikel").select("*").in("id", artikelIds);

  let prompt = vorlage + "\n\n";
  data.forEach(a => {
    const auswahl = selected.find(sel => sel.id === a.id);
    prompt += `\n---\n\n**${auswahl.rolle}**\n\n${a.volltext}\n`;
    if (auswahl.rolle === "Hintergrundstück" && auswahl.begruendung)
      prompt += `\nBegründung: ${auswahl.begruendung}\n`;
  });

  navigator.clipboard.writeText(prompt);
  alert("Prompt kopiert!");
}

getConfig().then(cfg => {
  supabase = supabase || createClient(cfg.supabaseUrl, cfg.publicAnonKey);
  ladeArtikel();
});

window.updateArticles = updateArticles;
window.promptGenerieren = promptGenerieren;
