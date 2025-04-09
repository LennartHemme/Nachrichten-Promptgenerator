document.addEventListener("DOMContentLoaded", () => {
  ladeArtikel();
});

function ladeArtikel() {
  const app = document.getElementById("app");
  app.innerHTML = "Lade Artikel...";

  fetch("/api/rss-proxy")
    .then((res) => res.json())
    .then((data) => render(data))
    .catch((err) => {
      console.error(err);
      app.innerHTML = "❌ Fehler beim Laden der Artikel.";
    });
}

function render(artikelListe) {
  const app = document.getElementById("app");
  if (!artikelListe.length) {
    app.innerHTML = "<p>Keine Artikel gefunden.</p>";
    return;
  }

  app.innerHTML =
    `<div class="artikel-grid">` +
    artikelListe
      .map(
        (a) => `
      <div class="card">
        <strong>${a.titel}</strong>
        <div class="artikel-teaser">${a.teaser}</div>
        <a href="${a.link}" target="_blank">Artikel ansehen</a>
      </div>`
      )
      .join("") +
    "</div>";
}

function updateArticles() {
  ladeArtikel(); // Gleiche Funktion wie beim Start
}

function generatePrompt() {
  const name = document.getElementById("autorName").value || "Unbekannt";
  const datum = new Date().toLocaleDateString("de-DE");
  const prompt = `Datum: ${datum}\nName: ${name}\n\n--- GPT-PROMPT ---\n\nBeispielinhalt`;

  document.getElementById("promptText").textContent = prompt;
  document.getElementById("promptDialog").showModal();
}

function copyPrompt() {
  const text = document.getElementById("promptText").textContent;
  navigator.clipboard
    .writeText(text)
    .then(() => alert("📋 Prompt wurde in die Zwischenablage kopiert!"))
    .catch(() => alert("❌ Kopieren fehlgeschlagen."));
}

function closeDialog() {
  document.getElementById("promptDialog").close();
}
