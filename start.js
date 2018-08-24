var express = require("express");
var app = express();

var path = require("path");

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// Root route
var indexRouter = require("./routes/index");
app.use("/", indexRouter);

app.listen(3000);