const express = require("express");
let router = express.Router();

const ForgeDataManagement = require("../models/forge-dm");

router.get("/hubs", async function (req, res) {
  const dm = new ForgeDataManagement(req.session);
  let hubs = await dm.getHubs();

  console.log(hubs);
  res.render("hubs", { hubs: hubs });
});

router.get("/hub/:hub_id/projects", async function (req, res) {
  let hubId = req.params.hub_id;

  const dm = new ForgeDataManagement(req.session);
  let projects = await dm.getProjects(hubId);

  console.log(projects);
  res.render("projects", { projects: projects });
});

router.get("/hub/:hub_id/project/:project_id/folders", async function (req, res) {
  let hubId = req.params.hub_id;
  let projectId = req.params.project_id;

  const dm = new ForgeDataManagement(req.session);
  let folders = await dm.getFolders(hubId, projectId);

  console.log(folders);
  res.render("folders", { folders: folders });
});

router.get("/hub/:hub_id/project/:project_id/folder/:folder_id/items", async function (req, res) {
  let hubId = req.params.hub_id;
  let projectId = req.params.project_id;
  let folderId = req.params.folder_id;

  const dm = new ForgeDataManagement(req.session);
  let items = await dm.getFolders(hubId, projectId, folderId);

  console.log(items);
  res.render("folders", { folders: items });
});

router.get("/hub/:hub_id/project/:project_id/folder/:folder_id/item/:item_id/versions", async function (req, res) {
  let hubId = req.params.hub_id;
  let projectId = req.params.project_id;
  let folderId = req.params.folder_id;
  let itemId = req.params.item_id;

  const dm = new ForgeDataManagement(req.session);
  let versions = await dm.getVersions(hubId, projectId, folderId, itemId);

  console.log(versions);
  res.render("versions", { versions: versions });
});

router.get("/version/:version_urn/view", async function (req, res) {
  let versionUrn = req.params.version_urn;
  let viewableId = req.query.viewable;

  const dm = new ForgeDataManagement(req.session);
  let viewer_link = await dm.getViewerLink(versionUrn, viewableId);

  console.log(viewer_link);
  res.redirect(viewer_link);
});

module.exports = router;