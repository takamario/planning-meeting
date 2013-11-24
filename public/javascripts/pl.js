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


plApp.controller("PlCtrl", ["$scope", function($scope) {
  $scope.productArea = "";
  $scope.answerOptions = ["OK", "NG", "N/A"];
  $scope.teams = ["team1", "team2", "team3", "team4", "team5", "team6", "team7", "team8", "team9"];
  $scope.newTeams = $scope.teams.join(", ");
  $scope.finalAnswerList = "ALL";
  $scope.tickets = [
{ ticketNo: "11111", productArea: "Area1", answers: {} },
{ ticketNo: "22222", productArea: "Area2, Area3", answers: {} },
{ ticketNo: "33333", productArea: "Area3, Area4", answers: {} },
{ ticketNo: "44444", productArea: "Area1, Area4", answers: {} },
{ ticketNo: "55555", productArea: "Area2, Area4", answers: {} },
{ ticketNo: "66666", productArea: "Area3", answers: {} }
];
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

socket.on("valueChange", function(data) {
  console.log(data);
  $scope.applyChange(data);
});
}]);
