var services = angular.module('VicinityManagerApp.services').
factory('userAccountAPIService', ['$http', 'configuration', function($http, configuration){

  var userAccountAPI = {};

  userAccountAPI.getUserAccountProfile = function(id) {
    return $http.get(configuration.apiUrl +'/useraccounts/' + id);
  };

  userAccountAPI.getUserAccounts = function(){
    return $http.get(configuration.apiUrl +'/useraccounts');
  };

  userAccountAPI.sendNeighbourRequest = function (id) {
    return $http.post(configuration.apiUrl +'/useraccounts/' + id + '/friendship');
  };

  userAccountAPI.acceptNeighbourRequest = function(id) {
    return $http.put(configuration.apiUrl +'/useraccounts/' + id + '/friendship/accept');
  };

  userAccountAPI.rejectNeighbourRequest = function(id) {
    return $http.put(configuration.apiUrl +'/useraccounts/' + id + '/friendship/reject');
  };

  userAccountAPI.cancelNeighbourRequest = function(id) {
    return $http.put(configuration.apiUrl +'/useraccounts/' + id + '/friendship/cancel');
  };

  userAccountAPI.cancelNeighbourship = function(id) {
    return $http.delete(configuration.apiUrl +'/useraccounts/' + id + '/friendship');
  };

  userAccountAPI.getMyDevices = function(id) {
    return $http.get(configuration.apiUrl +'/useraccounts/' + id + '/devices?sort=ASC');
  };

  userAccountAPI.getFriends = function(id) {
    return $http.get(configuration.apiUrl +'/useraccounts/' + id + '/friends?sort=ASC');
  };

  userAccountAPI.getNeighbourhood = function(id) {
    return $http.get(configuration.apiUrl +'/useraccounts/' + id + '/neighbourhood?sort=ASC');
  };

  userAccountAPI.getAllDevices = function(id) {
    return $http.get('http://localhost:3000/useraccounts/' + id + '/allDevices');
  };



  return userAccountAPI;
}]);
