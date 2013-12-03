var socket = io.connect("http://ubuntu:3000");

var plApp = angular.module("plApp", ["plFilters"], function($interpolateProvider) {
  $interpolateProvider.startSymbol("{*");
  $interpolateProvider.endSymbol("*}");
});

angular.module("plFilters", []).filter("answerFilter", [function() {
  return function (tickets, finalAnswerList) {
    var result = [];

    for (var i = 0, l = tickets.length; i < l; i++) {
      if (tickets[i].finalAnswer === finalAnswerList || finalAnswerList === "ALL") {
        result.push(tickets[i]);
      }
    }

    return result;
  };
}]);


plApp.controller("PlCtrl", ["$scope", "$http", "$filter", function($scope, $http, $filter) {
  $scope.answerOptions = ["OK", "NG", "N/A", "???"];
  $scope.columns = ["Type", "Ticket.No", "Summary", "Assignee", "Priority", "Status", "Product Area", "Labels", "Epic/Theme", "Marketplace"];
  $scope.teams = ["team1", "team2", "team3", "team4", "team5", "team6", "team7", "team8", "team9"];
  $scope.newTeams = $scope.teams.join(", ");
  $scope.errorMessage = "";
  $scope.tickets = [];
  $scope.assignee = "";
  $scope.status = "";
  $scope.productArea = "";
  $scope.labels = "";
  $scope.epicTheme = "";
  $scope.marketplace = "";
  $scope.finalAnswerList = "ALL";
  $scope.planName = $filter("date")(new Date(), "yyyy-MM-dd");

  for (var i = 0, l = $scope.tickets.length; i < l; i++) {
    // TODO: No need to loop over and over
    for (var j = 0, m = $scope.teams.length; j < m; j++) {
      $scope.tickets[i].answers[$scope.teams[j]] = null;
    }

    $scope.tickets[i].finalAnswer = "???";
  }

  $scope.valueChange = function() {
    console.log("value change event");
    $scope.restructAnswers();
    socket.emit("valueChange", $scope.tickets);
  };

  $scope.applyChange = function(data) {
    $scope.tickets = data;
    $scope.finalAnswersChange();

    // Apply changes
    $scope.$digest();
  };

  $scope.teamChange = function() {
    console.log("team change");
    $scope.teams = $scope.newTeams.replace(/\s/g, "").split(",");
  };

  $scope.finalAnswersChange = function() {
    for (var i = 0, l = $scope.tickets.length; i < l; i++) {
      var emptyFlg = false;
      for (var j = 0, m = $scope.teams.length; j < m; j++) {
        if ($scope.tickets[i].answers[$scope.teams[j]] === $scope.answerOptions[1]) {
          $scope.tickets[i].finalAnswer = $scope.answerOptions[1];
          break;
        }
        if ($scope.tickets[i].answers[$scope.teams[j]] === null) {
          emptyFlg = true;
          $scope.tickets[i].finalAnswer = "???";
        }
        if (emptyFlg === false) {
          $scope.tickets[i].finalAnswer = $scope.answerOptions[0];
        }
      }
    }
  };
  $scope.finalAnswersChange();

  $scope.restructAnswers = function() {
    for (var i = 0, l = $scope.tickets.length; i < l; i++) {
      for (var j = 0, m = $scope.teams.length; j < m; j++) {
        if ($scope.teams[j] in $scope.tickets[i].answers === false) {
          $scope.tickets[i].answers[$scope.teams[j]] = null;
        }
      }
      for (var k in $scope.tickets[i].answers) {
        if ($scope.teams.indexOf(k) === -1) {
          delete $scope.tickets[i].answers[k];
        }
      }
    }

    $scope.finalAnswersChange();
  };

  $scope.answerColor = function(answer) {
    if (answer === "OK") return "answer-success";
    if (answer === "NG") return "answer-error";
    if (answer === "???") return "answer-error";
    if (answer === "N/A") return "answer-na";
    return null;
  };

  $scope.searchTicket = function() {
    connectJIRA({
      jql: $scope.jql,
      username: $scope.username,
      password: $scope.password
    });
  };

  $scope.saveData = function() {
    sendServer({
      planName: $scope.planName,
      detail: {
        jql: $scope.jql,
        tickets: $scope.tickets,
        teams: $scope.teams,
      }
    });
  };

  function connectJIRA(params) {
    $http.post("/jql", params)
      .success(function(data) {
        if (data.statusCode !== 200) {
          $scope.errorMessage = "Status: " + data.statusCode + ", Error: " + data.error;
          return;
        }
        $scope.errorMessage = "";
        parseJIRAData(data);
      });
  }

  function parseJIRAData(data) {
    var tickets = [];
    for (var i = 0, l = data.result.issues.length; i < l; i++) {
      tickets.push({
        issuetype: data.result.issues[i].fields.issuetype.name,
        ticketNo: data.result.issues[i].key,
        summary: data.result.issues[i].fields.summary,
        assignee: parseAssignee(data.result.issues[i].fields.assignee),
        priority: data.result.issues[i].fields.priority.name,
        status: data.result.issues[i].fields.status.name,
        productArea: parseProductArea(data.result.issues[i].fields.customfield_11800),
        labels: parseEpicTheme(data.result.issues[i].fields.labels),
        epicTheme: parseEpicTheme(data.result.issues[i].fields.customfield_10001),
        marketplace: parseProductArea(data.result.issues[i].fields.customfield_12900),
        answers: {},
        ticketUrl: "https://" + data.jiraDomain + "/browse/" + data.result.issues[i].key
      });
    }
    $scope.tickets = tickets;

    $scope.restructAnswers();
  }

  function parseAssignee(data) {
    return (data !== null) ? data.displayName : "(Unassigned)";
  }

  function parseProductArea(data) {
    var productArea = [];
    if (data === null) return null;
    for (var i = 0, l = data.length; i < l; i++) {
      productArea.push(data[i].value);
    }
    return productArea.sort().join(", ");
  }

  function parseEpicTheme(data) {
    if (data === null) return null;
    return data.sort().join(", ");
  }

  function sendServer(data) {
    $http.post("/save", data)
      .success(function(response) {
        if (response.statusCode !== 200) {
          $scope.errorMessage = "Status: " + response.statusCode + ", Error: " + response.error;
          return;
        }
        $scope.errorMessage = "Saved!";
      });
  }

  socket.on("valueChange", function(data) {
    $scope.applyChange(data);
  });
}]);
