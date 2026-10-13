(function () {
  "use strict";
  const { fetchSheet, value } = window.SIMSheets;
  const { escapeHTML, formatDate, safeHttpUrl } = window.SIMUtils;
  let scheduleData = [];

  async function loadAnnouncements() {
    const list = document.getElementById("announcementList");
    const status = document.getElementById("announcementStatus");
    try {
      const cfg = window.SIM_CONFIG.sheets.pengumuman;
      const rows = await fetchSheet("pengumuman");
      const visible = rows.filter(row => {
        const target = value(row, "target", cfg.columns).toLowerCase();
        return !target || ["publik", "semua", "umum", "website"].includes(target);
      }).slice(0, 6);
      if (!visible.length) list.innerHTML = '<div class="empty-state">Belum ada pengumuman yang tersedia.</div>';
      else list.innerHTML = visible.map(row => {
        const title = value(row, "title", cfg.columns) || "Pengumuman";
        const body = value(row, "body", cfg.columns);
        const date = value(row, "date", cfg.columns);
        return `<article class="announcement-card"><div class="date">${escapeHTML(formatDate(date) || "INFORMASI MADRASAH")}</div><h3>${escapeHTML(title)}</h3><p>${escapeHTML(body)}</p></article>`;
      }).join("");
      status.textContent = "Data ditampilkan dari Google Sheets.";
    } catch (err) {
      list.innerHTML = '<div class="empty-state">Pengumuman belum dapat dimuat. Periksa URL CSV dan izin publikasi pada js/config.js.</div>';
      status.textContent = err.message;
    }
  }

  function renderSchedules(rows) {
    const body = document.getElementById("scheduleRows");
    const cfg = window.SIM_CONFIG.sheets.jadwal;
    const query = (document.getElementById("scheduleSearch")?.value || "").toLowerCase();
    const filtered = rows.filter(row => Object.values(row).join(" ").toLowerCase().includes(query));
    if (!filtered.length) {
      body.innerHTML = '<tr><td colspan="5" class="empty-cell">Jadwal belum tersedia atau tidak ada hasil pencarian.</td></tr>';
      return;
    }
    body.innerHTML = filtered.map(row => {
      const day = value(row, "day", cfg.columns), cls = value(row, "className", cfg.columns);
      const start = value(row, "start", cfg.columns), end = value(row, "end", cfg.columns);
      const subject = value(row, "subject", cfg.columns), teacher = value(row, "teacher", cfg.columns);
      return `<tr><td>${escapeHTML(day)}</td><td>${escapeHTML(cls)}</td><td>${escapeHTML([start,end].filter(Boolean).join("–"))}</td><td>${escapeHTML(subject)}</td><td>${escapeHTML(teacher)}</td></tr>`;
    }).join("");
  }

  async function loadSchedules() {
    const status = document.getElementById("scheduleStatus");
    try {
      scheduleData = await fetchSheet("jadwal");
      renderSchedules(scheduleData);
      status.textContent = "Data ditampilkan dari Google Sheets.";
    } catch (err) {
      document.getElementById("scheduleRows").innerHTML = '<tr><td colspan="5" class="empty-cell">Jadwal belum dapat dimuat. Periksa URL CSV dan nama kolom.</td></tr>';
      status.textContent = err.message;
    }
  }

  async function loadMaterials() {
    const list = document.getElementById("materialsList");
    const status = document.getElementById("materialsStatus");
    try {
      const cfg = window.SIM_CONFIG.sheets.materi;
      const rows = await fetchSheet("materi");
      if (!rows.length) list.innerHTML = '<div class="empty-state">Belum ada materi yang tersedia.</div>';
      else list.innerHTML = rows.slice(0, 12).map(row => {
        const title = value(row, "title", cfg.columns) || "Materi pembelajaran";
        const desc = value(row, "description", cfg.columns);
        const subject = value(row, "subject", cfg.columns);
        const url = safeHttpUrl(value(row, "url", cfg.columns));
        const type = value(row, "type", cfg.columns) || "DOKUMEN";
        return `<article class="material-card"><div class="material-top"><span class="file-pill">${escapeHTML(type)}</span></div><h3>${escapeHTML(title)}</h3><p>${escapeHTML(subject)}</p><p>${escapeHTML(desc)}</p>${url ? `<a class="button button-outline" href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">Buka / Unduh ↗</a>` : '<span class="source-note">Tautan belum tersedia.</span>'}</article>`;
      }).join("");
      status.textContent = "Hanya materi yang memang diizinkan untuk diakses publik yang boleh ditautkan di sini.";
    } catch (err) {
      list.innerHTML = '<div class="empty-state">Materi belum dapat dimuat. Periksa URL CSV dan izin publikasi.</div>';
      status.textContent = err.message;
    }
  }

  const loaders = { pengumuman: loadAnnouncements, jadwal: loadSchedules, materi: loadMaterials };
  window.addEventListener("sim:refresh", event => loaders[event.detail]?.());
  document.getElementById("scheduleSearch")?.addEventListener("input", () => renderSchedules(scheduleData));
  loadAnnouncements(); loadSchedules(); loadMaterials();
})();
