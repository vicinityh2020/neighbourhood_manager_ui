"use strict";
angular.module('VicinityManagerApp.controllers')
  .controller('companyProfileController',
    function($rootScope, $scope, $window, commonHelpers, $state, $stateParams, $location, $cookies, userAccountAPIService, itemsAPIService, tokenDecoder, AuthenticationService, Notification) {

      // ====== Triggers window resize to avoid bug =======
      commonHelpers.triggerResize();

      $scope.locationPrefix = $location.path();

      $scope.isMyProfile = true;
      $scope.imAdmin = false;
      $scope.canSendNeighbourRequest = false;
      $scope.canCancelNeighbourRequest = false;
      $scope.canAnswerNeighbourRequest = false;
      $scope.isNeighbour = false;
      $scope.friends = [];
      $scope.users = [];
      $scope.devices = 0;
      $scope.services = 0;
      $scope.loaded = false;
      $scope.showInput = false;

      // Initializa DOM elements
      $('a#loc2').show();
      $('p#loc1').show();
      $('a#loc4').hide();
      $('a#loc5').hide();
      $('input#loc3').hide();
      $('a#not2').show();
      $('p#not1').show();
      $('a#not4').hide();
      $('a#not5').hide();
      $('textarea#not3').hide();

      // Get resources & data ================
      $scope.myInit = function() {
        userAccountAPIService.getUserAccountProfile($stateParams.companyAccountId)
          .then(function(response) {
            updateScopeAttributes(response);
            $scope.loaded = true;
            return itemsAPIService.itemsCount('organisation');
          })
          .then(function(response) {
            $scope.devices = Number(response.data.message.devices);
            $scope.services = Number(response.data.message.services);
            // Check if it is the company profile and if the user is its admin
            $scope.isMyProfile = ($window.sessionStorage.companyAccountId === $stateParams.companyAccountId);
            var payload = tokenDecoder.deToken();
            var keyword = new RegExp('administrator');
            $scope.imAdmin = ($scope.isMyProfile && keyword.test(payload.roles));
          })
          .catch(errorCallback);
      };

      $scope.myInit();

      // Functions Neighbours ==================

      $scope.sendNeighbourRequest = function() {
        userAccountAPIService.sendNeighbourRequest($stateParams.companyAccountId)
          .then(function(response) {
            if (response.data.error === true) {
              Notification.error("Sending partnership request failed!");
            } else {
              Notification.success("Partnership request sent!");
            }
            $scope.onlyRefreshAccount();
          })
          .catch(errorCallback);
      };

      $scope.acceptNeighbourRequest = function() {
        userAccountAPIService.acceptNeighbourRequest($stateParams.companyAccountId)
          .then(function(response) {
            if (response.data.error === true) {
              Notification.error("Partnership request acceptation failed :(");
            } else {
              Notification.success("Partnership request accepted!");
            }
            $scope.onlyRefreshAccount();
          })
          .catch(errorCallback);
      };

      $scope.rejectNeighbourRequest = function() {
        userAccountAPIService.rejectNeighbourRequest($stateParams.companyAccountId)
          .then(function(response) {
            if (response.data.error === true) {
              Notification.error("Partnership request rejection failed :(");
            } else {
              Notification.success("Partnership request rejected!");
            }
            $scope.onlyRefreshAccount();
          })
          .catch(errorCallback);
      };

      $scope.cancelNeighbourRequest = function() {
        userAccountAPIService.cancelNeighbourRequest($stateParams.companyAccountId)
          .then(function(response) {
            if (response.data.error === true) {
              Notification.error("Partnership request cancelation failed :(");
            } else {
              Notification.success("Partnership request canceled!");
            }
            $scope.onlyRefreshAccount();
          })
          .catch(errorCallback);
      };

      $scope.cancelNeighbourship = function() {
        if (confirm('Are you sure? May affect existing contracts.')) {
          userAccountAPIService.cancelNeighbourship($stateParams.companyAccountId)
            .then(function(response) {
              if (response.data.error === true) {
                Notification.error("Partnership cancelation failed :(");
              } else {
                Notification.success("Partnership canceled!");
              }
              $scope.onlyRefreshAccount();
            })
            .catch(errorCallback);
        }
      };

      // Refresh $scope =================

      $scope.onlyRefreshAccount = function() {
        userAccountAPIService.getUserAccountProfile($stateParams.companyAccountId)
          .then(function(response) {
            updateScopeAttributes(response);
          })
          .catch(errorCallback);
      };

      function updateScopeAttributes(response) {
        $scope.name = response.data.message.name;
        $scope.avatar = response.data.message.avatar;
        $scope.occupation = response.data.message.accountOf.occupation;
        $scope.companyAccountId = response.data.message._id;
        $scope.location = response.data.message.location;
        $scope.notes = response.data.message.notes;
        $scope.bid = response.data.message.businessId;
        $scope.canSendNeighbourRequest = response.data.message.canSendNeighbourRequest;
        $scope.canCancelNeighbourRequest = response.data.message.canCancelNeighbourRequest;
        $scope.canAnswerNeighbourRequest = response.data.message.canAnswerNeighbourRequest;
        $scope.isNeighbour = response.data.message.isNeighbour;
        $scope.friends = response.data.message.knows;
        $scope.users = response.data.message.accountOf;
      }

      // Edit Profile Functions ===============

      $scope.locEdit = function() {
        $('a#loc2').hide();
        $('p#loc1').hide();
        $('a#loc4').show();
        $('a#loc5').show();
        $scope.locationNew = $scope.location;
        $('input#loc3').show();
      };

      $scope.locCancel = function() {
        $scope.locationNew = "";
        $('a#loc2').show();
        $('p#loc1').show();
        $('a#loc4').hide();
        $('a#loc5').hide();
        $('input#loc3').hide();
      };

      $scope.locSave = function() {
        var data = {
          location: $scope.locationNew
        };
        $scope.updateCompany(data);
        $('a#loc2').show();
        $('p#loc1').show();
        $('a#loc4').hide();
        $('a#loc5').hide();
        $('input#loc3').hide();
        $scope.locationNew = "";
      };

      $scope.notEdit = function() {
        $('a#not2').hide();
        $('p#not1').hide();
        $('a#not4').show();
        $('a#not5').show();
        $scope.notesNew = $scope.notes;
        $('textarea#not3').show();
      };

      $scope.notCancel = function() {
        $scope.notesNew = "";
        $('a#not2').show();
        $('p#not1').show();
        $('a#not4').hide();
        $('a#not5').hide();
        $('textarea#not3').hide();
      };

      $scope.notSave = function() {
        var data = {
          notes: $scope.notesNew
        };
        $scope.updateCompany(data);
        $('a#not2').show();
        $('p#not1').show();
        $('a#not4').hide();
        $('a#not5').hide();
        $('textarea#not3').hide();
        $scope.notesNew = "";
      };

      $("select#editThemeColor").change(function() {
        $rootScope.skinColor = $('select#editThemeColor').val();
        userAccountAPIService.putConfigurationParameters($window.sessionStorage.companyAccountId, {
            skinColor: $rootScope.skinColor
          })
          .then(
            function(response) {
              $rootScope.styles = ['hold-transition', 'skin-' + $rootScope.skinColor, 'sidebar-mini'];
              $rootScope.myColor = 'my-' + $rootScope.skinColor;
              $rootScope.bckColor = 'bck-' + $rootScope.skinColor;
              Notification.success('Configuration successfully updated!');
            })
          .catch(errorCallback);
      });

      $scope.updateCompany = function(data) {
        userAccountAPIService.updateUserAccounts($window.sessionStorage.companyAccountId, data)
          .then(
            function(response) {
              $scope.onlyRefreshAccount();
            })
          .catch(errorCallback);
      };

      $scope.removeOrg = function() {
        if (confirm('Are you sure?')) {
          userAccountAPIService.removeOrganisation($window.sessionStorage.companyAccountId)
            .then(
              function(response) {
                alert('Organisation successfully removed!');
                $cookies.remove("rM_V"); // If log out remove rememberMe cookie
                AuthenticationService.signout("/login");
              })
            .catch(errorCallback);
        }
      };

      // Avatar change functions ==============

      var base64String = "";

      $("input#input1").on('change', function(evt) {

        var tgt = evt.target || window.event.srcElement,
          files = tgt.files;

        if (FileReader && files && files.length) {
          var fr = new FileReader();
          fr.onload = function() {
            // $("img#pic").src = fr.result;
            $("img#pic").prop("src", fr.result);
            base64String = fr.result;
          };
          fr.readAsDataURL(files[0]);
        } else {
          // fallback -- perhaps submit the input to an iframe and temporarily store
          // them on the server until the user's session ends.
        }
      });

      $scope.showLoadPic = function() {
        $scope.showInput = true;
        $('#editCancel1').fadeIn('slow');
        $('#editUpload2').fadeIn('slow');
        $('#input1').fadeIn('slow');
      };

      $scope.cancelLoadPic = function() {
        $('#editCancel1').fadeOut('slow');
        $('#editUpload2').fadeOut('slow');
        $('#input1').fadeOut('slow');
        $('img#pic').fadeOut('slow');
        setTimeout(function() {
          $("img#pic").prop("src", $scope.avatar);
          $('img#pic').fadeIn('slow');
        }, 600);
      };

      $scope.uploadPic = function() {
        userAccountAPIService.updateUserAccounts($window.sessionStorage.companyAccountId, {
            avatar: base64String
          })
          .then(
            function(response) {
              $scope.avatar = response.data.message.avatar;
              $rootScope.$broadcast('refreshOrganisationAvatar', {avatar: $scope.avatar});
              $('#editCancel1').fadeOut('slow');
              $('#editUpload2').fadeOut('slow');
              $('#input1').fadeOut('slow');
              $('img#pic').fadeOut('slow');
              setTimeout(function() {
                $("img#pic").prop("src", $scope.avatar);
                $('img#pic').fadeIn('slow');
              }, 600);
            })
          .catch(errorCallback);
      };

      function errorCallback(err) {
        if (err.status === 404) {
          console.log(err);
          Notification.error("Company not found");
          $state.go("root.main.allEntities");
        } else {
          console.log(err);
          Notification.error("Server error");
        }
      }

    });
