'use strict'

angular.module('VicinityManagerApp.controllers').controller('allDevicesController',
   function ($scope, $window, itemsAPIService, searchAPIService, commonHelpers, itemsHelpers, Notification, $q){

// ====== Triggers window resize to avoid bug =======
    commonHelpers.triggerResize();

// Ensure scroll on top onLoad
    $window.scrollTo(0, 0);

    $scope.imMobile = Number($window.innerWidth) < 1000;
    $(window).on('resize',function(){
      $scope.imMobile = Number($window.innerWidth) < 1000;
    });

// Initialize variables and get initial data =============

   $scope.devs=[];
   $scope.onlyPrivateDevices = false;
   $scope.noItems = true;
   $scope.loaded = false;
   $scope.loadedPage = false;
   $scope.myId = $window.sessionStorage.companyAccountId;
   $scope.offset = 0;
   $scope.allItemsLoaded = false;
   $scope.typeOfItem = "devices";
   $scope.header = "My Devices";
   $scope.isCollapsed = true;
   // Ontology search
   $scope.ontology = {};
   $scope.ontology.selected = {};
   $scope.ontology.typeSubclasses = [];
   $scope.ontology.selected.type = "core:Device";
   $scope.ontology.selected.label = "- ALL TYPES -";
   $scope.ontology.reset = {};
   $scope.ontology.reset.type = "core:Device";
   $scope.ontology.reset.label = "- ALL TYPES -";

   $scope.listView = false;
   $scope.myOrderBy = 'name';
   $scope.accessFilterData = [
     {id: 0, name: "My disabled devices"},
     {id: 1, name: "My private devices"},
     {id: 2, name: "My devices for friends"},
     {id: 3, name: "My public devices"},
     {id: 4, name: "My devices"},
     {id: 8, name: "Contracted devices"},
     {id: 9, name: "Mine & Contracted devices"},
     {id: 5, name: "Friend's devices"},
     {id: 6, name: "All public devices"},
     {id: 7, name: "All devices"}
   ];
   $scope.selectedAccessFilter = $scope.accessFilterData[4];
   $scope.filterNumber = $scope.selectedAccessFilter.id;

   init();

   function init(){
     $scope.loaded = false;
      itemsAPIService.getAllItems($scope.myId, "device", $scope.offset, $scope.filterNumber, $scope.ontology.selected.type)
      .then(function(response){
        for(var i = 0; i < response.data.message.length; i++){
            $scope.devs.push(addCaption(response.data.message[i]));
        }
        $scope.noItems = ($scope.devs.length === 0);
        $scope.allItemsLoaded = response.data.message.length < 12;
        return searchAPIService.getOntologyTypes($scope.ontology.selected.type);
      })
      .then(function(response){
        $scope.ontology.typeSubclasses = response.data.message;
        $scope.ontology.typeSubclasses.push($scope.ontology.reset)
        $scope.loaded = true;
        $scope.loadedPage = true;
      })
      .catch(function(err){
        console.log(err);
        Notification.error("Server error");
      });
  }

  $scope.refresh = function(){
    $scope.devs=[];
    $scope.loaded = false;
     itemsAPIService.getAllItems($scope.myId, "device", $scope.offset, $scope.filterNumber, $scope.ontology.selected.type)
     .then(function(response){
       for(var i = 0; i < response.data.message.length; i++){
           $scope.devs.push(addCaption(response.data.message[i]));
       }
       $scope.noItems = ($scope.devs.length === 0);
       $scope.allItemsLoaded = response.data.message.length < 12;
         return searchAPIService.getOntologyTypes($scope.ontology.selected.type);
       })
       .then(function(response){
       $scope.ontology.typeSubclasses = response.data.message;
       $scope.ontology.typeSubclasses.push($scope.ontology.reset)
       $scope.loaded = true;
       $scope.loadedPage = true;
       if($scope.ontology.selected.type !== "core:Device") {
         $scope.header = $scope.header + "  with type: < " + $scope.ontology.selected.type + " >";
       } else {
         changeHeader($scope.filterNumber);
       }
      })
     .catch(function(err){
       console.log(err);
       Notification.error("Server error");
     });
 };

 /* FILTERS ACCESSED BY DOM */

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

$scope.onAccessFilterOntology = function(item){
  $scope.ontology.selected.type = item.type;
  $scope.ontology.selected.label = item.label;
  $scope.refresh();
};

/* OTHER PRIVATE FUNCTIONS */

  // Add caption based on item status and privacy
 function addCaption(item){
   item.statusCaption = item.status === 'enabled' ? "Enabled" : "Disabled";
   if(item.isPublic){ item.privacyCaption = 'Public';}
   else if(item.isFriendData){ item.privacyCaption = 'For Friends'; }
   else{ item.privacyCaption = 'Private'; }
   return item;
 }

 function changeHeader(n){
   switch (n) {
       case 0:
           $scope.header = "My disabled " + $scope.typeOfItem;
           break;
       case 1:
           $scope.header = "My private " + $scope.typeOfItem;
           break;
       case 2:
           $scope.header = "My shared " + $scope.typeOfItem;
           break;
       case 3:
           $scope.header = "My public " + $scope.typeOfItem;
           break;
       case 4:
           $scope.header = "My " + $scope.typeOfItem;
           break;
       case 5:
           $scope.header = "All shared " + $scope.typeOfItem;
           break;
       case 6:
           $scope.header = "All public " + $scope.typeOfItem;
           break;
       case 7:
           $scope.header = "All " + $scope.typeOfItem;
           break;
       case 8:
           $scope.header = "Contracted " + $scope.typeOfItem;
           break;
       case 9:
           $scope.header = "Mine & Contracted " + $scope.typeOfItem;
           break;
       default:
           $scope.header = "All " + $scope.typeOfItem;
           break;
         }
     }

/* OTHER FUNCTIONS ACCESS FROM DOM */

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
