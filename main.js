
function updateArticles() {
  const app = document.getElementById("app");
  app.innerHTML = "Lade Artikel...";

  const rssUrl = "https://www.radioemscherlippe.de/thema/lokalnachrichten-447.rss";
  fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(rssUrl)}`)
    .then(response => response.json())
    .then(data => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(data.contents, "text/xml");
      const items = doc.querySelectorAll("item");
      const articles = Array.from(items).slice(0, 6).map((item, i) => ({
        titel: item.querySelector("title").textContent,
        link: item.querySelector("link").textContent,
        teaser: item.querySelector("description")?.textContent || ""
      }));
      renderArticles(articles);
    })
    .catch(err => {
      app.innerHTML = "Fehler beim Laden der Artikel.";
      console.error(err);
    });
}

function renderArticles(articles) {
  const app = document.getElementById("app");
  app.innerHTML = '<div class="artikel-grid">' +
    articles.map(a => `
      <div class="card">
        <strong>${a.titel}</strong>
        <div class="artikel-teaser">${a.teaser.split(".")[0]}</div>
        <a href="${a.link}" target="_blank">Artikel ansehen</a>
      </div>
    `).join("") + '</div>';
}

function generatePrompt() {
  const name = document.getElementById("autorName").value || "Unbekannt";
  const datum = new Date().toLocaleDateString("de-DE");
  const text = `Datum: ${datum}
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

document.addEventListener("DOMContentLoaded", updateArticles);
