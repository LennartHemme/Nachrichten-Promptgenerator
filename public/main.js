async function loadArticles() {
  try {
    const response = await fetch("/api/rss");
    const articles = await response.json();

    const container = document.getElementById("articles");
    if (articles.error) {
      container.innerHTML = `<p>Fehler: ${articles.error}</p>`;
      return;
    }
    if (!articles.length) {
      container.innerHTML = "<p>Keine Artikel in den letzten 24 Stunden gefunden.</p>";
      return;
    }

    const html = articles.map(article => `
      <div class="article">
        <h3><a href="${article.link}" target="_blank">${article.titel}</a></h3>
        <p>${article.beschreibung}</p>
        <small>Veröffentlicht: ${article.pubDateFormatted}</small>
      </div>
    `).join("");

    container.innerHTML = html;
  } catch (error) {
    document.getElementById("articles").innerHTML = `<p>Fehler beim Laden der Artikel: ${error.message}</p>`;
  }
}

document.addEventListener("DOMContentLoaded", loadArticles);
