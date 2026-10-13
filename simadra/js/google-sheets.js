(function () {
  "use strict";

  function parseCSV(text) {
    const rows = [];
    let row = [], cell = "", quoted = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i], next = text[i + 1];
      if (c === '"' && quoted && next === '"') { cell += '"'; i++; }
      else if (c === '"') { quoted = !quoted; }
      else if (c === "," && !quoted) { row.push(cell); cell = ""; }
      else if ((c === "\n" || c === "\r") && !quoted) {
        if (c === "\r" && next === "\n") i++;
        row.push(cell); cell = "";
        if (row.some(v => v.trim() !== "")) rows.push(row);
        row = [];
      } else cell += c;
    }
    if (cell.length || row.length) { row.push(cell); rows.push(row); }
    if (!rows.length) return [];
    const headers = rows.shift().map(h => h.trim().replace(/^\uFEFF/, ""));
    return rows.map(values => {
      const item = {};
      headers.forEach((header, i) => item[header] = (values[i] || "").trim());
      return item;
    });
  }

  async function fetchSheet(key) {
    const config = window.SIM_CONFIG?.sheets?.[key];
    if (!config || !config.csvUrl) {
      throw new Error("URL CSV untuk sheet '" + key + "' belum diatur di js/config.js.");
    }
    const response = await fetch(config.csvUrl, { cache: "no-store" });
    if (!response.ok) throw new Error("Google Sheets mengembalikan status " + response.status);
    const csv = await response.text();
    return parseCSV(csv);
  }

  function value(row, field, columns) {
    const header = columns[field];
    return header ? (row[header] ?? "") : "";
  }

  window.SIMSheets = { fetchSheet, value, parseCSV };
})();
