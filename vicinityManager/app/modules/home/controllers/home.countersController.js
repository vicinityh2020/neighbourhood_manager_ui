"use strict";
angular.module('VicinityManagerApp.controllers')
/*
Displays my organisation counters
- It can show three levels: CID, AGID, OID
- Displays a table and graphs
*/
.controller('countersController',
function ($scope, $window, commonHelpers, counterAPIService, Notification) {

  // ====== Triggers window resize to avoid bug =======
  commonHelpers.triggerResize();

  // Main Variables

  $scope.loaded = false;
  $scope.headerCaption = "Message counters";
  $scope.organisationCreation = new Date(parseInt($window.sessionStorage.companyAccountId.substring(0, 8), 16) * 1000);
  $scope.data = {};
  $scope.showData = true;
  $scope.showWarning = false; // Displays no Data notification
  // Filters initialization
  $scope.filterObject = $window.sessionStorage.cid; // Initial selection is organisation (CID)
  $scope.objectType = "cid"; // Changes depending on the type of object
  $scope.filterPeriod = "week";
    // Filter agents vars
    $scope.agentsData = [{id: 0, name: $scope.filterObject, caption: "-- All Infrastructures --"}];
    $scope.agentDataSelected = $scope.agentsData[0];
    // Filter objects vars
    $scope.hideObjectFilter = true;
    $scope.objectsData = [{id: 0, name: $scope.agentDataSelected.name, caption: "-- All Objects --"}];
    $scope.objectDataSelected = $scope.objectsData[0];
    // Filter period vars
    $scope.periodData = [
      {id: 0, name: "day", caption: "Yesterday"},
      {id: 1, name: "week", caption: "Last 7 days"},
      {id: 2, name: "month", caption: "Last 30 days"}
    ];
    $scope.periodDataSelected = $scope.periodData[1];
  // Chart vars
  $scope.chartsInitialized = false;
  $scope.showBarChart = true; // Change to false if no data
  $scope.showPieChart = true; // Change to false if no data
  $scope.barChartData = initializeBarChart();
  $scope.pieChartData = initializePieChart();
  $scope.barChartInstance;
  $scope.pieChartInstance;
  $scope.chartColours = [
    'rgba(255, 99, 132, 0.5)',
    'rgba(54, 162, 235, 0.5)',
    'rgba(255, 206, 86, 0.5)',
    'rgba(75, 192, 192, 0.5)'
  ];

  // Main functions and initialization

  function init(){
    generateInvoicePeriods();
  }

  function reload(){
    $scope.loaded = false;
    counterAPIService.get($scope.filterObject, $scope.objectType, $scope.filterPeriod)
      .then(successCallback)
      .catch(errorCallback);
  }

  init();
  reload();

  // Callbacks

  function successCallback(response) {
    var data = [];
    var objects = [];
    if(response.data.message.data.length > 0){
      $scope.showData = true;
      $scope.showWarning = false;
      $scope.showPieChart = true;
      if($scope.periodDataSelected.name === "day") {
        $scope.showBarChart = false;
      } else {
        $scope.showBarChart = true;
      }
      data = response.data.message.data;
      objects = response.data.message.objects;
      processData(data);
      processObjects(objects, $scope.objectType);
      createCharts();
      Notification.success("Counters loaded");
    } else if(response.data.message.objects.length > 0) {
      $scope.data.period = {};
      $scope.showWarning = true;
      $scope.showData = false;
      $scope.showPieChart = false;
      $scope.showBarChart = false;
      objects = response.data.message.objects;
      processObjects(objects, $scope.objectType);
      Notification.warning("There is no data");
    } else {
      $scope.data.period = {};
      $scope.showWarning = true;
      $scope.showData = false;
      $scope.showPieChart = false;
      $scope.showBarChart = false;
      Notification.warning("There is no data");
    }
    $scope.loaded = true;
  }

  function errorCallback(error) {
    console.log(error);
    $scope.showWarning = true;
    $scope.showData = false;
    $scope.showPieChart = false;
    $scope.showBarChart = false;
    $scope.loaded = true;
    Notification.error("Problem retrieving counters");
  }

  //  UI Actions

  /*
    Update period displayed based on filter selection
  */
  $scope.onAccessFilterPeriod = function(item){
    $scope.filterPeriod = item.name;
    $scope.periodDataSelected = $scope.periodData[item.id];
    reload();
  };

  $scope.onAccessFilterAgent = function(item){
    $scope.filterObject = item.name;
    $scope.agentDataSelected = $scope.agentsData[item.id];
    if(item.caption === "-- All Infrastructures --"){
      $scope.objectType = "cid";
      $scope.hideObjectFilter = true;
      $scope.objectsData = [];
      $scope.objectDataSelected = {id: 0, name: $scope.agentDataSelected.name, caption: "-- All Objects --"};
    } else {
      $scope.objectType = "agid";
      $scope.objectsData = [];
      $scope.objectDataSelected = {id: 0, name: $scope.agentDataSelected.name, caption: "-- All Objects --"};
    }
    reload();
  };

  $scope.onAccessFilterObject = function(item){
    $scope.filterObject = item.name;
    $scope.objectDataSelected = $scope.objectsData[item.id];
    if(item.caption === "-- All Objects --"){
      $scope.filterObject = $scope.agentDataSelected.name;
      $scope.objectType = "agid";
    } else {
      $scope.objectType = "oid";
    }
    reload();
  };

  // Functions

  /*
  Process the data for:
    - Displaying in Table
    - Charts
  */
  function processData(data){
    // Sort array by date
    data.sort(function(a,b){
      // Turn your strings into dates, and then subtract them
      // to get a value that is either negative, positive, or zero.
      return new Date(a._id.date) - new Date(b._id.date);
    });
    // Chart
    // Reset Charts
    $scope.barChartData = null;
    $scope.barChartData = initializeBarChart();
    $scope.pieChartData = null;
    $scope.pieChartData = initializePieChart();
    // Aggregate period
    $scope.data.period = {};
    $scope.data.period.totalSize = 0;
    $scope.data.period.action = 0;
    $scope.data.period.property = 0;
    $scope.data.period.event = 0;
    $scope.data.period.technical = 0;
    $scope.data.period.total = 0;
    for(var i = 0, l = data.length; i < l; i++){
      // Table
      $scope.data.period.totalSize += data[i].totalSize;
      $scope.data.period.action += data[i].action;
      $scope.data.period.property += data[i].property;
      $scope.data.period.event += data[i].event;
      $scope.data.period.technical += data[i].info;
      $scope.data.period.technical += data[i].unknown;
      // Chart
      // Bar chart
      var aux = new Date(data[i]._id.date);
      $scope.barChartData.data.labels.push(
        aux.toLocaleDateString("en-GB")
      );
      $scope.barChartData.data.datasets[0].data.push(
        data[i].action + data[i].property + data[i].event + data[i].info + data[i].unknown
      );
      $scope.barChartData.data.datasets[0].backgroundColor.push(
        $scope.chartColours[1]
      );
      $scope.barChartData.data.datasets[0].borderColor.push(
        $scope.chartColours[1]
      );
    }
    // Chart
    // Pie chart
    $scope.pieChartData.options.title = { display: true, text: "Last Period Share"};
    $scope.pieChartData.data.datasets[0].data.push($scope.data.period.action);
    $scope.pieChartData.data.datasets[0].data.push($scope.data.period.property);
    $scope.pieChartData.data.datasets[0].data.push($scope.data.period.event);
    $scope.pieChartData.data.datasets[0].data.push($scope.data.period.technical);
  }

  /*
    Process the objects (gtw or devices) to create Objects filter
  */
  function processObjects(objects, type){
    if(type === "cid"){
      $scope.agentsData = [];
      var n = 0;
      $scope.agentsData.push({ id: n, name: $window.sessionStorage.cid, caption: "-- All Infrastructures --" });
      n = 1;
      for(var i = 0, l = objects.length; i < l; i++){
        $scope.agentsData.push({ id: n + i, name: objects[i].extid, caption: objects[i].id.name});
      }
    } else if(type === "agid"){
      $scope.hideObjectFilter = false;
      $scope.objectsData = [];
      var n = 0;
      $scope.objectsData.push({ id: n, name: $scope.agentDataSelected.name, caption: "-- All Objects --" });
      n = 1;
      for(var i = 0, l = objects.length; i < l; i++){
        $scope.objectsData.push({ id: n + i, name: objects[i].extid, caption: objects[i].id.name});
      }
    } else {
      $scope.hideObjectFilter = false;
    }
  }

  /*
  Generate available invoices periods for given company creation date
  */
  function generateInvoicePeriods(){
    var ini = $scope.organisationCreation;
    var current = new Date();
    var lastIndex = 3;
    var counter = 0;
    var current_month, current_year, next_month, next_year;
    while (current >= ini) {
      current_month = current.getMonth() === 0 ? 12 : current.getMonth();
      current_year = current.getMonth() === 0 ? current.getFullYear() - 1 : current.getFullYear();
      next_month = current.getMonth() === 0 ? 11 : current.getMonth() - 1;
      next_year = current.getMonth() === 0 ? current.getFullYear() - 1 : current.getFullYear();
      $scope.periodData.push(
        { id: lastIndex + counter, name: new Date(next_year, next_month), caption: "Invoice period " + current_month + "-" + current_year }
      )
      current = new Date(next_year, next_month);
      counter+=1;
    }
  }

  // CHARTS

  function createCharts(){
    if(!$scope.chartsInitialized){
      $scope.chartsInitialized = true;
      paintChart('barChart', 'bar', $scope.barChartData.data, $scope.barChartData.options);
      paintChart('pieChart', 'pie', $scope.pieChartData.data, $scope.pieChartData.options);
    } else {
      updateChart('bar', $scope.barChartData.data, $scope.barChartData.options);
      updateChart('pie', $scope.pieChartData.data, $scope.pieChartData.options);
    }
  }

  function paintChart(id, type, data, options){
    var ctx = document.getElementById(id).getContext('2d');
    if(type === "bar"){
      $scope.barChartInstance = new Chart(ctx, {
        type: type,
        data: data,
        options: options
      });
    } else {
      $scope.pieChartInstance = new Chart(ctx, {
        type: type,
        data: data,
        options: options
      });
    }
  }

  function updateChart(type, data, options){
    if(type === "bar"){
      $scope.barChartInstance.data = data;
      $scope.barChartInstance.options = options;
      $scope.barChartInstance.update();
    } else {
      $scope.pieChartInstance.data = data;
      $scope.pieChartInstance.options = options;
      $scope.pieChartInstance.update();
    }
  }

  function initializePieChart(){
      var obj = {
        data: {
          labels: ['Actions', 'Properties', 'Events', 'Technical'],
          datasets: [{
            data: [],
            backgroundColor: [
            'rgba(255, 99, 132, 0.5)',
            'rgba(54, 162, 235, 0.5)',
            'rgba(255, 206, 86, 0.5)',
            'rgba(75, 192, 192, 0.5)'
            ]
          }]
        },
        options: {}
      };
    return obj;
  }

  function initializeBarChart(){
    var obj = {
      data: {
        labels: [],
        datasets: [{
            label: '# of Messages',
            data: [],
            backgroundColor: [],
            borderColor: [],
            borderWidth: 1
        }]
      },
      options: {
          // title: { display: true, text: 'Messages per day'},
          scales: { yAxes: [{ ticks: { beginAtZero: true } }] }
      }
    };
    return obj;
  }

});
