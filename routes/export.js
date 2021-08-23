const express = require("express");
let router = express.Router();

const ForgeExport = require("../models/forge-export");

router.get("/hub/:hub_id", async function (req, res) {
    let hubId = req.params.hub_id;

    const forgeExport = new ForgeExport(req.session);
    let fileName = await forgeExport.exportHub(hubId);

    // Send file as response
    res.download(fileName);
});

router.get("/hub/:hub_id/project/:project_id", async function (req, res) {
    let hubId = req.params.hub_id;
    let projectId = req.params.project_id;

    const forgeExport = new ForgeExport(req.session);
    let fileName = await forgeExport.exportProject(hubId, projectId);

    // Send file as response
    res.download(fileName);
  });

  router.get("/hub/:hub_id/project/:project_id/folder/:folder_id", async function (req, res) {
    let hubId = req.params.hub_id;
    let projectId = req.params.project_id;
    let folderId = req.params.folder_id;

    const forgeExport = new ForgeExport(req.session);
    let fileName = await forgeExport.exportFolder(hubId, projectId, folderId);

    // Send file as response
    res.download(fileName);
  });

module.exports = router;