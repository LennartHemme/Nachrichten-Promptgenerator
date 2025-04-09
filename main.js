async function updateArticles() {
  const app = document.getElementById("app");
  app.innerHTML = "Lade Artikel...";

  try {
    const feedRes = await fetch("/api/rss");
    const feed = await feedRes.json();

    const heute = new Date().toDateString();
    const artikel = await Promise.all(feed.map(async item => {
      const scraped = await fetch(`/api/scrape?url=${encodeURIComponent(item.link)}`).then(r => r.json());
      return {
        titel: item.titel,
        link: item.link,
        text: scraped.text
      };
    }));

    renderArticles(artikel);
  } catch (e) {
    app.innerHTML = "❌ Fehler beim Laden";
    console.error(e);
  }
}

function renderArticles(artikel) {
  const app = document.getElementById("app");
  app.innerHTML = '<div class="artikel-grid">' + artikel.map(a => `
    <div class="card">
      <strong>${a.titel}</strong>
      <div class="artikel-teaser">${a.text.split("\n")[0]}</div>
      <a href="${a.link}" target="_blank">Artikel ansehen</a>
    </div>
  `).join('') + '</div>';
}
