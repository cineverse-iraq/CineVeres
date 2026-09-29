/*
 * CineVeres Source 2 configuration
 *
 * Put this file beside index.html on GitHub Pages.
 * The first URL is the public HTTPS URL of your TMDB-Embed-API server.
 * Add one or more backup URLs when you have them.
 */
(function () {
  window.CINADAM_SOURCE2_CONFIG = {
    apiBases: [
      "https://cineveres-source2.onrender.com"
      // , "https://YOUR-BACKUP-SOURCE2-DOMAIN"
    ],
    timeoutMs: 120000,
    preferredProvider: "vixsrc"
  };

  // Kept for compatibility with older CineVeres builds.
  window.CINADAM_SOURCE2_URL = window.CINADAM_SOURCE2_CONFIG.apiBases[0] || "";
})();
