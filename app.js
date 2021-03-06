/**
 * Board for planning meeting
 *
 * @author: shoei.takamaru <shoei.takamaru@mail.rakuten.com>
 */

var express = require("express")
  , routes = require("./routes")
  , http = require("http")
  , path = require("path");

var app = express()
  , server = http.createServer(app)
  , io = require("socket.io").listen(server);

app.configure(function() {
  app.set("port", process.env.PORT || 3000);
  app.set("views", __dirname + "/views");
  app.set("view engine", "hjs");
  app.use(express.favicon());
  app.use(express.logger("dev"));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, "public")));
});

app.configure("development", function() {
  app.use(express.errorHandler());
});

app.get("/", routes.index);
app.post("/jql", routes.jql);
app.post("/save", routes.save);

server.listen(app.get("port"), function() {
  console.log("Express server listening on port " + app.get("port"));
});

io.sockets.on("connection", function(socket) {
  socket.on("valueChange", function(data) {
    io.sockets.emit("valueChange", data);
  });
});
