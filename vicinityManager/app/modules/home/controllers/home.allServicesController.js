'use strict';
angular.module('VicinityManagerApp.controllers')
.controller('allServicesController',
   function ($scope, $window, itemsAPIService, commonHelpers, itemsHelpers, tokenDecoder, Notification){

// ====== Triggers window resize to avoid bug =======
     commonHelpers.triggerResize();

     // Ensure scroll on top onLoad
         $window.scrollTo(0, 0);

       $scope.imMobile = Number($window.innerWidth) < 1000;
       $(window).on('resize',function(){
         $scope.imMobile = Number($window.innerWidth) < 1000;
       });

// Initialize variables and get initial data =============

       $scope.items=[];
       $scope.loaded = false;
       $scope.loadedPage = false;
       $scope.noItems = true;
       $scope.myId = $window.sessionStorage.companyAccountId;
       $scope.myUserId = $window.sessionStorage.userAccountId;
       $scope.offset = 0;
       $scope.allItemsLoaded = false;
       $scope.accessFilterData = [
        {id: 0, name: "My disabled services"},
        {id: 1, name: "My private services"},
        {id: 2, name: "My services for friends"},
        {id: 3, name: "My public services"},
        {id: 4, name: "My services"},
        {id: 5, name: "Friend's services"},
        {id: 6, name: "All public services"},
        {id: 7, name: "All services"}
      ];
      $scope.selectedAccessFilter = $scope.accessFilterData[7];
      $scope.filterNumber = $scope.selectedAccessFilter.id;

       $scope.typeOfItem = "services";
       $scope.header = "All Services";
       $scope.canRequestService = false;
       $scope.listView = false;
       $scope.myOrderBy = 'name';

       var payload = tokenDecoder.deToken();
       for(var i in payload.roles){
         if(payload.roles[i] === 'infrastructure operator'){
           $scope.canRequestService = true;
         }
       }

       init();

      function init(){
        $scope.loaded = false;
        itemsAPIService.getAllItems($window.sessionStorage.companyAccountId, 'service', $scope.offset, $scope.filterNumber, null)
        .then(
          function successCallback(response){
            for(var i = 0; i < response.data.message.length; i++){
              for(var j = 0; j < response.data.message[i].hasContracts.length; j++){
                if(response.data.message[i].hasContracts[j].contractingUser){
                  if(response.data.message[i].hasContracts[j].contractingUser.toString() === $scope.myUserId.toString()) response.data.message[i].contracted += 1;
                }
              }
              $scope.items.push(addCaption(response.data.message[i]));
            }
            $scope.noItems = ($scope.items.length === 0);
            $scope.allItemsLoaded = response.data.message.length < 12;
            $scope.loaded = true;
            $scope.loadedPage = true;
          })
          .catch(function(err){
            console.log(err);
            Notification.error("Server error");
          });
      }


// Refresh scope

$scope.refresh = function(value){
  $scope.items=[];
  $scope.loaded = false;
   itemsAPIService.getAllItems($scope.myId, "service", $scope.offset, $scope.filterNumber, null)
   .then(function(response){
     for(var i = 0; i < response.data.message.length; i++){
       for(var j = 0; j < response.data.message[i].hasContracts.length; j++){
         if(response.data.message[i].hasContracts[j].contractingUser){
           if(response.data.message[i].hasContracts[j].contractingUser.toString() === $scope.myUserId.toString()) response.data.message[i].contracted += 1;
         }
       }
         $scope.items.push(addCaption(response.data.message[i]));
     }
     $scope.noItems = ($scope.items.length === 0);
     $scope.allItemsLoaded = response.data.message.length < 12;
     $scope.loaded = true;
     $scope.loadedPage = true;
     changeHeader($scope.filterNumber);
   })
   .catch(function(err){
     console.log(err);
     Notification.error("Server error");
   });
};

  // Filters items

  $scope.filterItems = function(n){
      $scope.filterNumber = n;
      $scope.offset = 0;
      changeHeader(n);
      $scope.refresh();
  };

  $scope.onAccessFilterSelected = function(item){
    $scope.offset = 0;
    $scope.filterItems(item.id);
  };

  function changeHeader(n){
    switch (n) {
        case 0:
            $scope.header = "My disabled " + $scope.typeOfItem;
            break;
        case 1:
            $scope.header = "My private " + $scope.typeOfItem;
            break;
        case 2:
            $scope.header = "My " + $scope.typeOfItem + " for friends";
            break;
        case 3:
            $scope.header = "My public " + $scope.typeOfItem;
            break;
        case 4:
            $scope.header = "My " + $scope.typeOfItem;
            break;
        case 5:
            $scope.header = "All " + $scope.typeOfItem + " for friends";
            break;
        case 6:
            $scope.header = "All public " + $scope.typeOfItem;
            break;
        case 7:
            $scope.header = "All " + $scope.typeOfItem;
            break;
        default:
            $scope.header = "All " + $scope.typeOfItem;
            break;
          }
      }

  // Add caption based on item status and privacy
  function addCaption(item){
    item.statusCaption = item.status === 'enabled' ? "Enabled" : "Disabled";
    if(item.isPublic){ item.privacyCaption = 'Service is public';}
    else if(item.isFriendData){ item.privacyCaption = 'Access for friends'; }
    else{ item.privacyCaption = 'Private data'; }
    return item;
  }

  // Trigers load of more items
    $scope.loadMore = function(){
        $scope.loaded = false;
        $scope.offset += 12;
        init();
    };

    $scope.changeView = function(){
      $scope.listView = !($scope.listView);
    };

    $scope.orderByMe = function(x) {
      if($scope.myOrderBy === x){
        $scope.rev=!($scope.rev);
      }
      $scope.myOrderBy = x;
    };

    $scope.onSort = function(order){
      $scope.rev = order;
    };

});
