var vicinityManagerServices = require('../vicinityManager/vicinityManagerServices.js');
var exositeServices = require('../exosite/exositeServices.js');
var updateDevicesServices = require('./updateDevicesServices.js');
var winston = require('winston');
var async = require('async');

winston.level = 'debug';

function updateListOfDevicesInCloud() {
  var sharedDevices = [];
  var cloudDevices = [];
  var oldDevices = [];
  var newDevices = [];

  winston.log('debug', 'Update list of devices in cloud started');

  async.series([

      function(callback){
        winston.log('debug', 'List of shared devices');

        vicinityManagerServices.getSharedDevices(function(data){
          sharedDevices = data;
          winston.log('debug', 'Call back');
          callback();
        });
      },

      function(callback){
        winston.log('debug', 'List of devics in ExoSite');

        exositeServices.getDevices(function(data){
          cloudDevices = data;
          winston.log('debug', 'Call back');
          callback();
        });
      },

      function(callback){
        winston.log('debug', 'create list of shared devices which needs to be removed');
        oldDevices = updateDevicesServices.getOldDevices(cloudDevices, sharedDevices);
        winston.log('debug', 'devices should be removed: ' + oldDevices.length);
        callback();
      },

      function(callback){
        winston.log('debug', 'create list of shared devices which needs to be added');
        newDevices = updateDevicesServices.getNewDevices(cloudDevices, sharedDevices);
        callback();
      },

      function(callback){
        winston.log('debug', 'remove devices');
        exositeServices.removeDevices(oldDevices, callback);
      }
    ],

      function() {
        winston.log('debug', 'add devices');
        exositeServices.addDevices(newDevices);
      });

  // //TODO: Get list of shared devices in VICINITY;
  // var sharedDevices = vicinityManagerServices.getSharedDevices();
  //
  // //TODO: Get list of shared devices in ExoSite;
  // var cloudDevices = exositeServices.getDevices();
  //
  // //TODO: Create list of shared devices which needs to be removed from ExoSite;
  // var oldDevices = updateDevicesServices.getOldDevices(cloudDevices, sharedDevices);
  //
  // //TODO: Create list of shared deveice which needs to be added to ExoSite;
  // var newDevices = updateDevicesServices.getNewDevices(cloudDevices, sharedDevices);
  //
  // //TODO: Add shared devices to ExoSite;
  // exositeServices.addDevices(newDevices);
  //
  // //TODO: Remove shared devices from ExoSite;
  // exositeServices.removeDevices(oldDevices);
}

module.exports.performUpdate = updateListOfDevicesInCloud;
