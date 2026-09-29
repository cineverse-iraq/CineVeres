/* CineVeres Source 2 configuration */
(function () {
  window.CINADAM_SOURCE2_CONFIG = {
    apiBases: [
      "https://cineveres-source2.onrender.com"
    ],
    timeoutMs: 60000,
    preferredProvider: "vixsrc",
    // AI endpoint intentionally left empty: never expose an AI secret in the browser.
    aiDescriptionEndpoint: ""
  };
  window.CINADAM_SOURCE2_URL = window.CINADAM_SOURCE2_CONFIG.apiBases[0] || "";
})();
