'use strict';
angular.module('VicinityManagerApp.controllers').
  controller('myNodesController',
  function ($scope, $state, $window, commonHelpers, nodeAPIService, Notification) {

// ======== Set initial variables ==========

// ====== Triggers window resize to avoid bug =======
  commonHelpers.triggerResize();

  // Ensure scroll on top onLoad
  $window.scrollTo(0, 0);

  $scope.imMobile = Number($window.innerWidth) < 768;
  $(window).on('resize',function(){
    $scope.imMobile = Number($window.innerWidth) < 768;
  });

  $scope.rev = false;
  $scope.myOrderBy = 'name';
  $scope.loadedPage = false;
  $scope.gatewayKey = "Introduce your public key here";
  $scope.nodeUpdatingKey = "";

  $('div#keymodal').hide();
  $(document).keyup(function(e) {
     if (e.keyCode == 27) {
        $('div#keymodal').hide();
    }
  });

  var myInit = function(){
  nodeAPIService.getAll($window.sessionStorage.companyAccountId)
  .then(function(response){
      $scope.nodes = response.data.message;
      try{
        countItems();
        $scope.loadedPage = true;
      } catch(err) {
        console.log(err);
        Notification.warning("Node items could not be counted");
        $scope.loadedPage = true;
      }
    })
    .catch(function(err){
      console.log(err);
      Notification.error("Server error");
    });
  };

  myInit();

// ======== Main functions =========

// Remove func
$scope.deleteNode = function(adid){
  if(confirm('Are you sure? It may take some time (Approx 1min every 100 items)')){
    $scope.loadedPage = false;
    nodeAPIService.removeKey(adid)
    .then(
      function successCallback(response){
        return nodeAPIService.updateOne(adid, {status : "deleted"}); // upd status to removed of node in MONGO
    })
    .then(
      function successCallback(response){
        if(response.error){
          $scope.loadedPage = true;
          Notification.error("Error deleting node");
          myInit();
        } else {
          $scope.loadedPage = true;
          Notification.success("Access Point successfully removed!!");
          myInit();
        }
      })
      .catch(function(err){
        console.log(err);
        Notification.error("Error deleting node");
      });
    }
  };

  // Access node management
  $scope.goToEdit = function(i){
      $state.go("root.main.nodeDetail",{nodeId: i});
  };

// MODALS

$scope.showModal = function (id) {
  nodeAPIService.getKey(id) // upd status to removed of node in MONGO
  .then(
    function successCallback(response){
      if(response.data.key){
        $scope.gatewayKey = response.data.key;
      } else {
        $scope.gatewayKey = "Introduce your public key here";
      }
      $scope.nodeUpdatingKey = id;
      $('div#keymodal').show();
  })
  .catch(function(err){
    console.log(err);
    Notification.error("Error retrieving key");
  });
};

$scope.saveModal = function () {
  nodeAPIService.postKey($scope.nodeUpdatingKey, {key: $scope.gatewayKey})
  .then(
    function successCallback(response){
      $('div#keymodal').hide();
      updateNodeKey($scope.nodeUpdatingKey, true);
      $scope.nodeUpdatingKey = "";
      $scope.gatewayKey = "Introduce your public key here";
      Notification.success("Key successfully stored!");
    })
    .catch(function(err){
      console.log(err);
      Notification.error("Error storing key");
    });
};

$scope.removeModal = function () {
  nodeAPIService.removeKey($scope.nodeUpdatingKey)
  .then(
    function successCallback(response){
      $('div#keymodal').hide();
      updateNodeKey($scope.nodeUpdatingKey, false);
      $scope.nodeUpdatingKey = "";
      $scope.gatewayKey = "Introduce your public key here";
      Notification.success("Key successfully removed!");
  })
  .catch(function(err){
    console.log(err);
    Notification.error("Error removing key");
  });
};

$scope.closeModal = function () {
  $scope.nodeUpdatingKey = "";
  $scope.gatewayKey = "Introduce your public key here";
  $('div#keymodal').hide();
};


// ==== Navigation functions =====

    $scope.orderByMe = function(x) {
      if($scope.myOrderBy === x){
        $scope.rev=!($scope.rev);
      }
      $scope.myOrderBy = x;
    };

    $scope.onSort = function(order){
      $scope.rev = order;
    };

// Other Functions

    function countItems(){
      for(var i = 0; i < $scope.nodes.length; i++){
        $scope.nodes[i].numItems = $scope.nodes[i].hasItems.length;
      }
    }

    function updateNodeKey(adid, status){
      for(var i = 0, l = $scope.nodes.length; i < l; i++){
        if($scope.nodes[i].adid === adid){
          $scope.nodes[i].hasKey = status;
        }
      }
    }

});
