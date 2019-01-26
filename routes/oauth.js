const express = require("express");
let router = express.Router();

const ForgeOAuth = require("../models/forge-oauth");
const config = require("../config/config");

router.get("/callback", async function (req, res) {
  const credentials = new ForgeOAuth(req.session);
  try {
    await credentials.setCode(req.query.code);
  } catch (error) {
    console.log(error);
  }

  res.redirect("/dm/hubs");
});

router.get("/url", function (req, res) {
  let url = "https://developer.api.autodesk.com" +
    "/authentication/v1/authorize?response_type=code" +
    "&client_id=" + config.credentials.client_id +
    "&redirect_uri=" + config.credentials.callback_url +
    "&scope=" + config.scopes.internal.join("%20");
  res.end(url);
});

router.get("/signout", function (req, res) {
  req.session = null;
  res.redirect("/");
});

module.exports = router;