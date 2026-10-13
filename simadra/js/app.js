(function () {
  "use strict";
  const toggle = document.getElementById("menuToggle");
  const nav = document.getElementById("mainNav");
  if (toggle && nav) toggle.addEventListener("click", () => nav.classList.toggle("open"));
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
  document.querySelectorAll("[data-refresh]").forEach(button => {
    button.addEventListener("click", () => {
      window.dispatchEvent(new CustomEvent("sim:refresh", { detail: button.dataset.refresh }));
    });
  });
  window.SIMUtils = {
    escapeHTML(value) {
      return String(value ?? "").replace(/[&<>"']/g, ch => ({
        "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
      }[ch]));
    },
    formatDate(value) {
      if (!value) return "";
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("id-ID", {day:"numeric",month:"short",year:"numeric"}).format(date);
    },
    safeHttpUrl(value) {
      try {
        const url = new URL(value, window.location.href);
        return ["https:", "http:"].includes(url.protocol) ? url.href : "";
      } catch (_) { return ""; }
    }
  };
})();
