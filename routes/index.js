const express = require("express");
let router = express.Router();

/* GET login page. */
router.get("/", function(req, res) {
  res.render("index", { title: "Forge App", contents: "Welcome to Forge Lab" });
});

module.exports = router;