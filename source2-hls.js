(function () {
  window.CINADAM_SOURCE2_CONFIG = {
    // The proven local Cinemana Proxy used for Source 2.
    // Add your public proxy URL first later if you deploy the proxy publicly.
    apiBases: [
      "http://localhost:8788",
      "http://127.0.0.1:8788"
    ],
    timeoutMs: 60000,
    preferredProvider: "egybest",
    aiDescriptionEndpoint: ""
  };
  window.CINADAM_SOURCE2_URL = window.CINADAM_SOURCE2_CONFIG.apiBases[0] || "";
})();
