angular.module('VicinityManagerApp.controllers').
  controller('myNodesController',
  function ($scope,
            $state,
            $stateParams,
            $window,
            $location,
            $http,
            nodeAPIService,
            Notification) {

// ======== Set initial variables ==========

  $scope.rev = false;
  $scope.myOrderBy = 'name';

  var myInit = function(){
  nodeAPIService.getAll($window.sessionStorage.companyAccountId)
    .then(
      function successCallback(response){
        $scope.nodes = response.data.message.hasNodes;
      },
      function errorCallback(response){}
    );
  }

  myInit();

// ======== Main functions =========

    $scope.deleteNode = function(id){
      var newNodes = [];
      for(var i = 0; i < $scope.nodes.length; i++){
        if($scope.nodes[i]._id !== id){
          newNodes.push($scope.nodes[i]._id);
        }
      }
      var query = {hasNodes: newNodes};
      nodeAPIService.deleteOne($window.sessionStorage.companyAccountId,query)
        .then(
          function successCallback(response){
            var query2 = {
              status : "deleted"
            };
            nodeAPIService.updateOne(id, query2)
              .then(
                function successCallback(response){
                  nodeAPIService.deleteResource('users', {route : id})
                    .then(
                      function successCallback(response){
                        Notification.success("Node successfully removed!!");
                        myInit();
                      },
                      function errorCallback(response){
                          $window.alert("Error");
                      }
                    );
                },
                function errorCallback(response){}
              );
          },
          function errorCallback(response){}
        );
    }


    $scope.createGroup = function(){  // Debug only -- TODO Remove

      // var payload = {
      //   route: '593a44510a1bad02b11d5d12',
      //   description: "Reagon"
      // };
      //
      // nodeAPIService.getResource('users')
      //   .then(
      //     function successCallback(response){
      //       $window.alert("Success");
      //     },
      //     function errorCallback(response){
      //         $window.alert("Error");
      //     }
      //   );
      var payload = {
        name: $window.sessionStorage.companyAccountId,
        description: "Reagon"
      };

      nodeAPIService.postResource('groups',payload)
        .then(
          function successCallback(response){
            $window.alert("Success");
          },
          function errorCallback(response){
              $window.alert("Error");
          }
        );
    }

// ==== Navigation functions =====

    $scope.goToEdit = function(i){
        $state.go("root.main.nodeDetail",{nodeId: i});
    }

    $scope.orderByMe = function(x) {
      if($scope.myOrderBy === x){$scope.rev=!($scope.rev)}
        $scope.myOrderBy = x;
      }

});
