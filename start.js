var express = require("express");
var app = express();

var path = require("path");

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// cookie-based session
var cookieSession = require("cookie-session");
app.use(cookieSession({
  name: "forge-session",
  keys: ["forge-secure-key"],
  httpOnly: false,
  maxAge: 14 * 24 * 60 * 60 * 1000 // 14 days, same as refresh token
}));

// Root route
var indexRouter = require("./routes/index");
app.use("/", indexRouter);

// OAuth 3-legged route
var authRouter = require("./routes/oauth");
app.use("/oauth", authRouter);

app.listen(3000);