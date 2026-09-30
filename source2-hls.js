(function () {
  // Local admin/source2 endpoint. The server is bound to port 8788 in this setup.
  window.CINADAM_SOURCE2_CONFIG = {
    apiBases: ["http://localhost:8788", "http://127.0.0.1:8788"],
    timeoutMs: 60000,
    preferredProvider: "egybest",
    aiDescriptionEndpoint: ""
  };
  window.CINADAM_SOURCE2_URL = "http://localhost:8788";
})();
