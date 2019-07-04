'use strict';
angular.module('VicinityManagerApp.controllers')
.controller('homeController',
function ($rootScope, $scope, $window, Base64, tokenDecoder, commonHelpers, $interval, userAccountAPIService) {

  // ====== Triggers window resize to avoid bug =======
    commonHelpers.triggerResize();

  // Checks if it is necessary to display goToTop
  $interval(checkScroll, 1000);

  // Listen to updates on the user roles and refresh DOM
  $scope.$on('refreshToken', function(event, data){
    myInit();
  });

  // Click on toggle
  $scope.clickToggle = function(){
    $rootScope.$broadcast('togglePress', {});
  }
  /*
  Initializes skin color based on skinColor field in useraccounts MONGO schema
  */
  $rootScope.styles = ['hold-transition', 'skin-blue', 'sidebar-mini'];
  $rootScope.skinColor = 'blue'; //Default on error
  $rootScope.myColor = 'my-blue';
  $rootScope.bckColor = 'bck-blue';
  userAccountAPIService.getConfigurationParameters($window.sessionStorage.companyAccountId)
    .then(
      function successCallback(response){
        if(response.data.message.skinColor){
          $rootScope.skinColor = response.data.message.skinColor;
          $rootScope.styles = ['hold-transition', 'skin-' + $rootScope.skinColor, 'sidebar-mini'];
          $rootScope.myColor = 'my-' + $rootScope.skinColor;
          $rootScope.bckColor = 'bck-' + $rootScope.skinColor;
        } else {
          $rootScope.skinColor = 'blue'; //Default on error
          $rootScope.styles = ['hold-transition', 'skin-blue', 'sidebar-mini'];
          $rootScope.myColor = 'my-blue';
          $rootScope.bckColor = 'bck-blue';
        }
      },
      function errorCallback(err){
        console.log(err);
        $rootScope.skinColor = 'blue'; //Default on error
        $rootScope.styles = ['hold-transition', 'skin-' + $rootScope.skinColor, 'sidebar-mini'];
        $rootScope.myColor = 'my-' + $rootScope.skinColor;
        $rootScope.bckColor = 'bck-' + $rootScope.skinColor;
      }
    );


    // Initializes variables and resources

    $scope.isDev = false;
    $scope.isInfOp = false;
    $scope.isScrollable = false;
    $scope.isAdmin = false;
    $scope.isIntegrator = false;

    function myInit(){
      var payload = tokenDecoder.deToken();
      $scope.isDev = payload.roles.indexOf('devOps') !== -1;
      $scope.isInfOp = payload.roles.indexOf('infrastructure operator') !== -1;
      $scope.isDevOwn = payload.roles.indexOf('device owner') !== -1;
      $scope.isServProv = payload.roles.indexOf('service provider') !== -1;
      $scope.isIntegrator = payload.roles.indexOf('system integrator') !== -1;
      $scope.isAdmin = payload.roles.indexOf('administrator') !== -1;
    };

    myInit();

    // Scroll to top
    $scope.goToTop = function(){
        $window.scrollTo(0, 0);
    };

    function checkScroll(){
      if( $(window).height() < $(document).height() ) {
        $scope.isScrollable = true;
      } else {
        $scope.isScrollable = false;
      }
    }

  }
);
