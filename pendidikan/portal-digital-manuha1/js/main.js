(() => {
  "use strict";

  const groups = document.getElementById("appGroups");
  const search = document.getElementById("searchInput");
  const noResults = document.getElementById("noResults");
  const logo = document.getElementById("brandMark");

  document.getElementById("year").textContent = new Date().getFullYear();

  if (MADRASAH_CONFIG.logo && /^https:\/\//i.test(MADRASAH_CONFIG.logo)) {
    logo.style.backgroundImage = `url("${MADRASAH_CONFIG.logo}")`;
    logo.classList.add("has-logo");
    logo.textContent = "";
  }

  function makeCard(app) {
    const card = document.createElement("article");
    card.className = "app-card";

    const icon = document.createElement("div");
    icon.className = "app-icon";
    icon.textContent = app.ikon || "◈";

    const title = document.createElement("h4");
    title.textContent = app.nama;

    const description = document.createElement("p");
    description.textContent = app.deskripsi;

    const action = document.createElement("a");
    action.className = "app-action";
    action.textContent = app.url ? "Buka aplikasi ↗" : "Segera tersedia";

    if (app.url && /^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/i.test(app.url)) {
      action.href = app.url;
      action.target = "_blank";
      action.rel = "noopener noreferrer";
      action.setAttribute("aria-label", `Buka ${app.nama} di tab baru`);
    } else {
      action.classList.add("disabled");
      action.removeAttribute("href");
      action.setAttribute("aria-disabled", "true");
      action.tabIndex = -1;
    }

    card.append(icon, title, description, action);
    return card;
  }

  function render(keyword = "") {
    groups.replaceChildren();
    const normalized = keyword.trim().toLocaleLowerCase("id-ID");
    const apps = MADRASAH_CONFIG.aplikasi.filter(app => {
      const searchable = `${app.nama} ${app.kategori} ${app.deskripsi}`.toLocaleLowerCase("id-ID");
      return searchable.includes(normalized);
    });

    const categories = [...new Set(apps.map(app => app.kategori))];

    categories.forEach(category => {
      const section = document.createElement("section");
      section.className = "category";

      const heading = document.createElement("div");
      heading.className = "category-title";
      const title = document.createElement("h3");
      title.textContent = category;
      heading.appendChild(title);

      const grid = document.createElement("div");
      grid.className = "app-grid";

      apps.filter(app => app.kategori === category).forEach(app => {
        grid.appendChild(makeCard(app));
      });

      section.append(heading, grid);
      groups.appendChild(section);
    });

    noResults.hidden = apps.length !== 0;
  }

  search.addEventListener("input", event => render(event.target.value));
  render();
})();
