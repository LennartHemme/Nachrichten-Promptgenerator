
document.addEventListener("DOMContentLoaded", updateArticles);

function updateArticles() {
  const app = document.getElementById("app");
  app.innerHTML = "Lade Artikel...";

  const feedUrl = "https://www.radioemscherlippe.de/thema/lokalnachrichten-447.rss";
  const proxyUrl = `/api/proxy?url=${encodeURIComponent(feedUrl)}`;

  fetch(proxyUrl)
    .then(res => res.text())
    .then(parseRSS)
    .then(renderArticles)
    .catch(err => {
      app.innerHTML = "Fehler beim Laden der Artikel.";
      console.error(err);
    });
}

function parseRSS(xmlText) {
  const parser = new DOMParser();
  const xml = parser.parseFromString(xmlText, "text/xml");
  const items = Array.from(xml.querySelectorAll("item"));
  return items.slice(0, 5).map(item => ({
    titel: item.querySelector("title").textContent,
    link: item.querySelector("link").textContent,
    teaser: item.querySelector("description")?.textContent.split(".")[0] || ""
  }));
}

function renderArticles(articles) {
  const app = document.getElementById("app");
  app.innerHTML = '<div class="artikel-grid">' +
    articles.map(a => `
      <div class="card">
        <strong>${a.titel}</strong>
        <div class="artikel-teaser">${a.teaser}</div>
        <a href="${a.link}" target="_blank">Artikel ansehen</a>
      </div>
    `).join('') + '</div>';
}

function generatePrompt() {
  const name = document.getElementById("autorName").value || "Unbekannt";
  const text = `Datum: ${new Date().toLocaleDateString("de-DE")}
Name: ${name}

--- GPT-PROMPT ---

Beispielinhalt`;
  document.getElementById("promptText").textContent = text;
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
