const express = require("express");
let router = express.Router();

/* GET login page. */
router.get("/", function(req, res) {
  res.render("index", { title: "ACC Documents Log", contents: "Welcome to ACC Documents Log Exporter" });
});

module.exports = router;