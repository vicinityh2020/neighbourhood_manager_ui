'use strict';
angular.module('VicinityManagerApp.controllers').
controller('userAccountController', function($scope, $window, $cookies, commonHelpers, userAPIService, AuthenticationService, Notification) {
  $scope.name = "";
  $scope.avatar = "";
  $scope.occupation = "";
  $scope.userAccountId = "";
  $scope.companyAccountId = "";
  $scope.loaded = false;

  // ====== Triggers window resize to avoid bug =======
  commonHelpers.triggerResize();

  // Listen to updates on the avatar and refresh DOM
  $scope.$on('refreshUserAvatar', function(event, data){
    $scope.avatar = data.avatar;
  });

  $scope.signout = function(){
    console.log("Begin: Signout");
    $cookies.remove("rM_V"); // If log out remove rememberMe cookie
    AuthenticationService.signout("/login");
    console.log("End: Signout");
  };

  userAPIService.getUser($window.sessionStorage.userAccountId)
  .then(function(response){
      $scope.name = response.data.message.name;
      $scope.occupation = response.data.message.occupation;
      $scope.avatar = response.data.message.avatar;
      $scope.userAccountId = $window.sessionStorage.userAccountId;
      $scope.companyAccountId = $window.sessionStorage.companyAccountId;
      $scope.loaded = true;
  })
  .catch(function(err){
    console.log(err);
    Notification.error("Server error");
  });

});
