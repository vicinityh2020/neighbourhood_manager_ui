'use strict';
angular.module('VicinityManagerApp.controllers').
controller('companyAccountController', function($scope, $window, commonHelpers, userAccountAPIService, Notification) {

  $scope.isToggled = false;

  // ====== Triggers window resize to avoid bug =======
  commonHelpers.triggerResize();

  // Listen to updates on the avatar and refresh DOM
  $scope.$on('refreshOrganisationAvatar', function(event, data){
    $scope.avatar = data.avatar;
  });

  $scope.$on('togglePress', function(event, data){
    $scope.isToggled = !$scope.isToggled;
  });

  $scope.name = "";
  $scope.avatar = "";
  $scope.companyAccountId = "";
  $scope.loaded = false;

  userAccountAPIService.getUserAccountProfile($window.sessionStorage.companyAccountId)
  .then( function(response) {
    try{
      $scope.name = response.data.message.name;
      $scope.avatar = response.data.message.avatar;
      $scope.companyAccountId = response.data.message._id;
      $scope.loaded = true;
    } catch(err){
      console.log(err);
      Notification.warning("Problem fetching data");
    }
  })
  .catch( function(err){
    console.log(err);
    Notification.error("Server error");
  });
});
