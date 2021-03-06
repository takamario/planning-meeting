exports.index = function(req, res) {
  res.render("index");
};

exports.jql = function(req, res) {
  if (!req.body.username || !req.body.password || !req.body.jql) {
    res.json({
      statusCode: 400,
      error: "Bad Request: Required username, password, jql",
      result: {}
    });
    return;
  }
  var request = require("request")
    , jiraDomain = "localhost";
  request({
    url: "https://" + jiraDomain + "/rest/api/2/search",
    json: {
      jql: req.body.jql,
      maxResults: 500,
      fields: [
        "issuetype",
        "key",
        "summary",
        "assignee",
        "priority",
        "status",
        "resolution",
        "customfield_11800",  // Product Area
        "labels",
        "customfield_10001",  // Epic/Theme
        "customfield_12900"   // Marketplace
      ]
    },
    method: "post",
    auth: {
      user: req.body.username,
      pass: req.body.password
    }
  }, function(error, response, body) {
    if (error || response.statusCode !== 200) {
      res.json({
        statusCode: response.statusCode,
        error: error,
        result: {},
        jiraDomain: jiraDomain
      });
      return;
    }
    res.json({
      statusCode: response.statusCode,
      error: null,
      result: body,
      jiraDomain: jiraDomain
    });
  });
};

exports.save = function(req, res) {
  var plData = req.body
    , redis = require("redis")
    , redisCli = redis.createClient()
    , prefix = "planning-meeting:"
    , password = "PASSWORD";

  redisCli.on("error", function(error) {
    res.json({
      statusCode: 500,
      error: error
    });
    redisCli.end();
    return;
  });

  redisCli.auth(password, function(err) {
    if (err) {
      res.json({
        statusCode: 500,
        error: error
      });
      redisCli.end();
      return;
    }
    redisCli.set(prefix + plData.planName, JSON.stringify(plData.detail), function(error, result) {
      res.json({
        statusCode: 200,
        error: null
      });
      redisCli.end();
      return;
    });
  });
};
