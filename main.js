let artikel = [];
let letzterPrompt = "";

function updateArticles() {
  const app = document.getElementById("app");
  app.innerHTML = "Lade Artikel...";

  fetch("/api/artikel")
    .then(res => res.json())
    .then(data => {
      artikel = data;
      renderArticles(data);
    })
    .catch(err => {
      app.innerHTML = "Fehler beim Laden der Artikel.";
      console.error(err);
    });
}

function renderArticles(articles) {
  const app = document.getElementById("app");
  app.innerHTML = '<div class="artikel-grid">' + articles.map((a, i) => `
    <div class="card">
      <strong>${a.titel}</strong>
      <div class="artikel-teaser">${a.text.split("\n")[0]}</div>
      <a href="${a.link}" target="_blank">Artikel ansehen</a>
      <label>Einordnen als:
        <select id="rolle-${i}">
          <option value="">Nicht verwenden</option>
          <option value="1">1. Meldung</option>
          <option value="2">2. Meldung</option>
          <option value="3">3. Meldung</option>
          <option value="H">Hintergrund</option>
        </select>
      </label>
      <label>Begründung (optional):
        <textarea id="begruendung-${i}" rows="2"></textarea>
      </label>
    </div>
  `).join('') + '</div>';
}

function generatePrompt() {
  const name = document.getElementById("autorName").value || "Unbekannt";
  const datum = new Date().toLocaleDateString('de-DE');
  const selected = [];

  artikel.forEach((a, i) => {
    const rolle = document.getElementById(`rolle-${i}`).value;
    const begruendung = document.getElementById(`begruendung-${i}`).value;
    if (rolle) {
      selected.push({ ...a, rolle, begruendung });
    }
  });

  let text = `Datum: ${datum}\nName: ${name}\n\n`;

  ["1", "2", "3"].forEach(r => {
    const item = selected.find(e => e.rolle === r);
    if (item) text += `# ${r}. Meldung: ${item.titel}\n${item.text}\n\n`;
  });

  const h = selected.find(e => e.rolle === "H");
  if (h) {
    text += `# Hintergrund: ${h.titel}\n${h.text}\n`;
    if (h.begruendung) text += `Begründung: ${h.begruendung}\n\n`;
  }

  text += "--- GPT-PROMPT ---\n\n";

  fetch("/api/vorlage")
    .then(r => r.text())
    .then(vorlage => {
      letzterPrompt = text + vorlage;
      document.getElementById("promptText").textContent = letzterPrompt;
      document.getElementById("promptDialog").showModal();
    });
}

function copyPrompt() {
  navigator.clipboard.writeText(letzterPrompt)
    .then(() => alert("📋 Prompt wurde in die Zwischenablage kopiert!"))
    .catch(() => alert("❌ Kopieren fehlgeschlagen."));
}

function closeDialog() {
  document.getElementById("promptDialog").close();
}

updateArticles();
