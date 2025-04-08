document.addEventListener("DOMContentLoaded", () => {
  updateArticles();
});

function updateArticles() {
  const app = document.getElementById("app");
  app.innerHTML = "Lade Artikel...";

  const rssUrl = encodeURIComponent("https://www.radioemscherlippe.de/thema/lokalnachrichten-447.rss");

  fetch(`/api/rss-proxy?url=${rssUrl}`)
    .then(res => res.json())
    .then(data => renderArticles(data))
    .catch(err => {
      app.innerHTML = "Fehler beim Laden der Artikel.";
      console.error(err);
    });
}

function renderArticles(articles) {
  const app = document.getElementById("app");
  if (!articles || articles.length === 0) {
    app.innerHTML = "Keine Artikel gefunden.";
    return;
  }

  app.innerHTML = '<div class="artikel-grid">' +
    articles.map(a => `
      <div class="card">
        <strong>${a.title}</strong>
        <div class="artikel-teaser">${a.teaser}</div>
        <a href="${a.link}" target="_blank">Artikel ansehen</a>
      </div>
    `).join('') +
    '</div>';
}

function generatePrompt() {
  const name = document.getElementById("autorName").value || "Unbekannt";
  const datum = new Date().toLocaleDateString('de-DE');

  const prompt = `Datum: ${datum}\nName: ${name}\n\n--- GPT-PROMPT ---\n\nBeispielinhalt`;

  document.getElementById("promptText").textContent = prompt;
  document.getElementById("promptDialog").showModal();
}

function copyPrompt() {
  const text = document.getElementById("promptText").textContent;
  navigator.clipboard.writeText(text)
    .then(() => alert("📋 Prompt wurde in die Zwischenablage kopiert!"))
    .catch(() => alert("❌ Kopieren fehlgeschlagen."));
}

function closeDialog() {
  document.getElementById("promptDialog").close();
}
