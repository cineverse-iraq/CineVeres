/*
 * CineVeres Source 2 configuration
 *
 * Public TMDB-Embed-API endpoint used by the admin panel and player.
 * Keep AI description endpoint empty until you deploy a secure server-side
 * AI proxy; never put an AI provider secret in this browser file.
 */
(function () {
  window.CINADAM_SOURCE2_CONFIG = {
    apiBases: [
      "https://cineveres-source2.onrender.com"
    ],
    timeoutMs: 60000,
    preferredProvider: "vixsrc",
    aiDescriptionEndpoint: ""
  };

  window.CINADAM_SOURCE2_URL = window.CINADAM_SOURCE2_CONFIG.apiBases[0] || "";
})();
