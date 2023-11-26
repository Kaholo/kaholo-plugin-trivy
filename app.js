const kaholoPluginLibrary = require("@kaholo/plugin-library");

const trivyService = require("./trivy-service");

module.exports = kaholoPluginLibrary.bootstrap(
  {
    runTrivyScan: trivyService.runTrivyScan,
  },
);
