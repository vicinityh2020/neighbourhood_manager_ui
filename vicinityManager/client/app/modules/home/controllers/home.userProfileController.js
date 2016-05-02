angular.module('VicinityManagerApp.controllers')
.controller('userProfileController',
function ($scope, $window, $stateParams, $location, userAccountAPIService, AuthenticationService, Notification) {

  $scope.locationPrefix = $location.path();
  console.log("location:" + $location.path());
  $scope.name = {};
  $scope.avatar = {};
  $scope.occupation = {};
  $scope.organisation = {};
  $scope.userAccountId = {};
  $scope.isMyProfile = true;
  $scope.canSendNeighbourRequest = false;
  $scope.canCancelNeighbourRequest = false;
  $scope.canAnswerNeighbourRequest = false;
  $scope.isNeighbour = false;
  $scope.location = {};
  $scope.badges = {};
  $scope.notes = {};
  $scope.friends = [];
  $scope.following = [];
  $scope.followers = [];
  $scope.gateways = [];




    $scope.sendNeighbourRequest = function () {
        var result = userAccountAPIService
            .sendNeighbourRequest($scope.userAccountId)
                .success(function(response) {
                    if (response.error == true) {
                        Notification.error("Sending neighbour request failed!");
                    } else {
                        Notification.success("Neighbour request sent!");
                    }

                    userAccountAPIService.getUserAccountProfile($scope.userAccountId).success(updateScopeAttributes);
                });
    }

    $scope.acceptNeighbourRequest = function () {
        userAccountAPIService.acceptNeighbourRequest($scope.userAccountId)
            .success(function(response){
                if (response.error == true) {
                    Notification.error("Neighbour request acceptation failed :(");
                } else {
                    Notification.success("Neighbour request accepted!");
                }

                userAccountAPIService.getUserAccountProfile($scope.userAccountId).success(updateScopeAttributes);
            });
    }

    $scope.rejectNeighbourRequest = function() {
        userAccountAPIService.rejectNeighbourRequest($scope.userAccountId)
            .success(function(response){
                if (response.error ==true) {
                    Notification.error("Neighbour request rejection failed :(");
                } else {
                    Notification.success("Neighbour request rejected!");
                }

                userAccountAPIService.getUserAccountProfile($scope.userAccountId).success(updateScopeAttributes);
            });
    }

    $scope.cancelNeighbourRequest = function() {
        userAccountAPIService.cancelNeighbourRequest($scope.userAccountId)
            .success(function(response){
                if (response.error ==true) {
                    Notification.error("Neighbour request cancelation failed :(");
                } else {
                    Notification.success("Neighbour request canceled!");
                }

                userAccountAPIService.getUserAccountProfile($scope.userAccountId).success(updateScopeAttributes);
            });
    }

    $scope.cancelNeighbourship = function() {
        userAccountAPIService.cancelNeighbourship($scope.userAccountId)
            .success(function(response){
                if (response.error ==true) {
                    Notification.error("Neighbourship cancelation failed :(");
                } else {
                    Notification.success("Neighbourship canceled!");
                }

                userAccountAPIService.getUserAccountProfile($scope.userAccountId).success(updateScopeAttributes);
            });
    }

  if ($window.sessionStorage.userAccountId === $stateParams.userAccountId){
    $scope.isMyProfile = true;
  } else {
    $scope.isMyProfile = false;
  }

  userAccountAPIService.getUserAccountProfile("5722fd2216f9cc1446651945").success(updateScopeAttributes);

  function updateScopeAttributes(response){

    i=0;
    j=0;
    while (i==0){
      if (response.message.accountOf[j].email==$window.sessionStorage.username){
        $scope.name =response.message.accountOf[j].name;
        $scope.occupation=response.message.accountOf[j].occupation;
        $scope.avatar =response.message.accountOf[j].avatar;
        $scope.userAccountId = response.message.accountOf[j]._id;
        $scope.location = response.message.accountOf[j].location;
        i=1;
      };
      j++;
    }


      // $scope.name = response.message.accountOf.name;
      // $scope.avatar = response.message.avatar;
      // $scope.occupation = response.message.accountOf.occupation;
      $scope.organisation = response.message.organisation;
      // $scope.userAccountId = response.message._id;
      $scope.badges = response.message.badges;
      $scope.notes = response.message.notes;
      $scope.canSendNeighbourRequest = response.message.canSendNeighbourRequest;
      $scope.canCancelNeighbourRequest = response.message.canCancelNeighbourRequest;
      $scope.canAnswerNeighbourRequest = response.message.canAnswerNeighbourRequest;
      $scope.isNeighbour = response.message.isNeighbour;
      $scope.friends = response.message.knows;
  }
});
