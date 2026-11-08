(() => {
  "use strict";
  const groups = document.getElementById("appGroups");
  const search = document.getElementById("searchInput");
  const noResults = document.getElementById("noResults");
  const logo = document.getElementById("brandMark");
  const title = document.querySelector(".brand-copy strong");
  const motto = document.querySelector(".hero p");

  document.getElementById("year").textContent = new Date().getFullYear();

  function makeCard(app) {
    const card = document.createElement("article");
    card.className = "app-card";
    const icon = document.createElement("div");
    icon.className = "app-icon";
    icon.textContent = app.ikon || "📌";
    const name = document.createElement("h4");
    name.textContent = app.nama;
    const desc = document.createElement("p");
    desc.textContent = app.deskripsi || "";
    const link = document.createElement("a");
    link.className = "app-action";
    link.textContent = "Buka aplikasi ↗";
    link.href = app.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.setAttribute("aria-label", `Buka ${app.nama} di tab baru`);
    card.append(icon, name, desc, link);
    return card;
  }

  function render(apps, keyword = "") {
    groups.replaceChildren();
    const q = keyword.trim().toLocaleLowerCase("id-ID");
    const filtered = apps.filter(app =>
      `${app.nama} ${app.kategori} ${app.deskripsi}`.toLocaleLowerCase("id-ID").includes(q)
    );
    const categories = [...new Set(filtered.map(a => a.kategori || "LAINNYA"))];
    categories.forEach(category => {
      const section = document.createElement("section");
      section.className = "category";
      const heading = document.createElement("div");
      heading.className = "category-title";
      const h = document.createElement("h3");
      h.textContent = category;
      heading.appendChild(h);
      const grid = document.createElement("div");
      grid.className = "app-grid";
      filtered.filter(a => (a.kategori || "LAINNYA") === category).forEach(a => grid.appendChild(makeCard(a)));
      section.append(heading, grid);
      groups.appendChild(section);
    });
    noResults.hidden = filtered.length !== 0;
  }

  function jsonp(url) {
    return new Promise((resolve, reject) => {
      const callback = "portalCallback_" + Date.now() + "_" + Math.floor(Math.random() * 100000);
      const script = document.createElement("script");
      const timeout = setTimeout(() => { cleanup(); reject(new Error("Waktu koneksi ke konfigurasi portal habis.")); }, 15000);
      function cleanup() {
        clearTimeout(timeout);
        delete window[callback];
        script.remove();
      }
      window[callback] = data => { cleanup(); resolve(data); };
      script.onerror = () => { cleanup(); reject(new Error("Tidak dapat memuat konfigurasi portal.")); };
      const separator = url.includes("?") ? "&" : "?";
      script.src = url + separator + "action=public&callback=" + encodeURIComponent(callback) + "&t=" + Date.now();
      document.head.appendChild(script);
    });
  }

  async function init() {
    const api = MADRASAH_CONFIG.publicApiUrl;
    if (!api || api.includes("GANTI_DENGAN")) {
      noResults.hidden = false;
      noResults.textContent = "Portal belum dihubungkan ke Public API administrator.";
      return;
    }
    try {
      const data = await jsonp(api);
      const settings = data.settings || {};
      const apps = (data.apps || []).filter(a => {
        const isActive = a.aktif === true || String(a.aktif).toLowerCase() === "true";
        const url = String(a.url || "").trim();
        // Terima semua alamat HTTPS yang valid, termasuk Apps Script,
        // EMIS, E-RKAM, PIP, SIMSARPRAS, dan layanan eksternal lainnya.
        let isValidHttps = false;
        try {
          const parsed = new URL(url);
          isValidHttps = parsed.protocol === "https:" && !!parsed.hostname;
        } catch (_) {
          isValidHttps = false;
        }
        return isActive && isValidHttps;
      });
      if (settings.nama_madrasah && title) title.textContent = settings.nama_madrasah.toUpperCase();
      if (settings.logo_url) {
        logo.style.backgroundImage = `url("${settings.logo_url}")`;
        logo.classList.add("has-logo");
        logo.textContent = "";
      }
      if (settings.motto && motto) motto.textContent = settings.motto + " — Akses layanan pembelajaran, penilaian, ujian, dan administrasi madrasah melalui satu halaman.";
      search.addEventListener("input", e => render(apps, e.target.value));
      render(apps);
    } catch (err) {
      noResults.hidden = false;
      noResults.textContent = "Konfigurasi aplikasi belum dapat dimuat. Periksa URL Public API dan deployment Apps Script.";
      console.error(err);
    }
  }
  init();
})();
