document.addEventListener("DOMContentLoaded", () => {
  updateArticles();
});

function updateArticles() {
  const app = document.getElementById("app");
  app.innerHTML = "<p>Lade Artikel...</p>";

  fetch("/api/rss-proxy")
    .then(res => res.json())
    .then(data => {
      if (!data.length) {
        app.innerHTML = "<p>Keine Artikel gefunden.</p>";
        return;
      }

      app.innerHTML = `
        <div class="artikel-grid">
          ${data.map(a => `
            <div class="card">
              <strong>${a.titel}</strong>
              <div class="artikel-teaser">${a.text.split("\n")[0]}</div>
              <a href="${a.link}" target="_blank">Artikel ansehen</a>
            </div>
          `).join("")}
        </div>
      `;
    })
    .catch(err => {
      console.error(err);
      app.innerHTML = "<p>Fehler beim Laden der Artikel.</p>";
    });
}

function generatePrompt() {
  const name = document.getElementById("autorName").value || "Unbekannt";
  const datum = new Date().toLocaleDateString('de-DE');
  const text = `Datum: ${datum}\nName: ${name}\n\n--- GPT-PROMPT ---\n\nBeispielinhalt`;

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
