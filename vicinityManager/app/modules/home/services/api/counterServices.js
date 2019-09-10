'use strict';
var services = angular.module('VicinityManagerApp.services').
factory('counterAPIService', ['$http', 'configuration', function($http, configuration){

  var counterAPI = {};

  counterAPI.get = function(id, type, date) {
    return $http.get(configuration.apiUrl + '/commServer/counters?' + type + '=' + id + '&date=' + date);
  };

  return counterAPI;
}]);
