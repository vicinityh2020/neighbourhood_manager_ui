// Global objects and variables

var logger = require("../../middlewares/logger");
var sharingRules = require('../../services/sharingRules');
var itemOp = require('../../models/vicinityManager').item;
var userOp = require('../../models/vicinityManager').user;
var nodeOp = require('../../models/vicinityManager').node;
var contractOp = require('../../models/vicinityManager').contract;
var notifications = require('../../services/notifications/notificationsHelper');
var audits = require('../../services/audit/audit');

/**
 * Move the item to a different user
 * It has to be moved to serv prov or dev own
 *
 * @param {Object} oid MongoId+oid+name
 * @param {Object} uidNew MongoId+email
 * @param {Object} uidOld MongoId+email
 *
 * @return {String} Success/error
 */
function moveItem(oid, uidNew, uidOld){
  var itemVisibility, userVisibility, itemContracts, userContracts, cid;
  return new Promise(function(resolve, reject) {
    itemOp.findOneAndUpdate(
      {"_id": oid.id},
      {$set: {uid: uidNew} },
      { projection: {hasContracts: 1, accessLevel: 1}, returnNewDocument: true }
    )
    .then(function(response){
      itemContracts = response.hasContracts;
      itemVisibility = response.accessLevel;
      // TODO consider checking if ater removing the item the user has contracts without items
      return userOp.update(
        {"_id": uidOld.id},
        {$pull: {hasItems: {id: oid.id} } }
      );
    })
    .then(function(response){
      prevUserContracts = response.hasContracts;
      return userOp.findOneAndUpdate(
        {"_id": uidNew.id},
        {$push: {hasItems: oid } },
        { projection: {accessLevel: 1, hasContracts: 1, "cid.id": 1}, returnNewDocument: true }
      );
    })
    .then(function(response){
      userVisibility = response.accessLevel;
      userContracts = response.hasContracts;
      cid = response.cid.id;
      // First change visibility of device, because it might remove some contracts
      if(Number(userVisibility) < Number(itemVisibility)){
        return sharingRules.changePrivacy([oid.id], uidNew.id, uidNew.extid, cid);
      } else {
        return false;
      }
    })
    .then(function(response){
      if(itemsContracts){
        // After being sure contracts are still valid, add them to new user
        return addContracts(itemsContracts, uidNew);
      } else {
        return false;
      }
    })
    .then(function(response){
      resolve("Success");
    })
    .catch(function(err){
      logger.debug(error);
      reject(error);
    });
  });
}

/**
 * Move the contract to a different user
 * It has to be moved to infrastructure operator
 *
 * @param {Object} ctid MongoId+ctid
 * @param {Object} uidNew MongoId+email
 * @param {Object} uidOld MongoId+email
 *
 * @return {String} Success/error
 */
function moveContract(ctid, uidNew, uidOld){
  var typeOfUser; // Stores whether the user is iotOwner or foreignIot
  return new Promise(function(resolve, reject) {
    // Find if user that was contract admin still has devices in it
    itemOp.find({"uid.id": uidOld.id, "hasContracts.ctid": ctid.extid}, {oid: 1},
      function(error, response){
        if(error){
          logger.debug(error);
          reject(error);
        }
        else if(response){ // Has devices, then keep old user in contract without admin role
           userOp.findOneAndupdate(
              {"_id": uidOld.id, "hasContracts.ctid": ctid.ctid},
              {$set: {"hasContracts.$.admin": false} },
              { projection: {hasContracts: 1}, returnNewDocument: false } // return old document
            )
          .then(function(response){ // Fetch contract object and give it to new user
            var contracts = response.hasContracts;
            var ct = getContract(contracts, ctid.ctid);
            typeOfUser = ct.imForeign ? "foreignIot.uid" : "iotOwner.uid";
            return userOp.findOneAndupdate( {"_id": uidNew.id}, {$push: {hasContracts: ct} });
          })
          .then(function(response){
            return contractOp.update({"_id": ctid.id}, {$push: { typeOfUser: uidNew} });
          })
          .then(function(response){
            resolve('Success');
          })
          .catch(function(err){
            logger.debug(err);
            reject(err);
          });
        } else { // Does not have devices, then completely remove old user from contract
          userOp.findOneAndupdate(
              { "_id": uidOld.id },
              { $pull: {hasContracts: {ctid: ctid.ctid} } },
              { projection: {hasContracts: 1}, returnNewDocument: false } // return old document
            )
          .then(function(response){ // Fetch contract object and give it to new user
            var contracts = response.hasContracts;
            var ct = getContract(contracts, ctid.ctid);
            typeOfUser = ct.imForeign ? "foreignIot.uid" : "iotOwner.uid";
            return userOp.findOneAndupdate(
              {"_id": uidNew.id},
              {$push: {hasContracts: ct} });
          })
          .then(function(response){
            return contractOp.update({"_id": ctid.id}, { $pull: { typeOfUser: {id: uidOld.id} } });
          })
          .then(function(response){
            return contractOp.update({"_id": ctid.id}, { $push: { typeOfUser: uidNew} });
          })
          .then(function(response){
            resolve('Success');
          })
          .catch(function(err){
            logger.debug(err);
            reject(err);
          });
        }
    });
  });
}

/**
 * Move the item to a different gateways
 * It has to be of the same type
 *
 * @param {Object} oid MongoId+oid+name
 * @param {Object} adid MongoId+adid+name+type
 *
 * @return {Array} objects
 */
function changeGateway(oid, adid){
  return new Promise(function(resolve, reject) {
    nodeOp.update( {"_id": adid.id}, {$push: {hasItems: oid} })
    .then(function(response){
      return itemOp.findOneAndUpdate(
        {"_id": oid.id},
        {$set: {adid: adid} },
        {
          projection: {adid: 1},
          returnNewDocument: false,
        }
      );
    })
    .then(function(response){
      nodeOp.update( {"_id": response.adid.id}, {$pull: {hasItems: {id : oid.id} } });
    })
    .then(function(response){
      resolve("Success");
    })
    .catch(function(err){
      logger.debug(err);
      reject(err);
    });
  });
}

/**
 * Get all users that can have items or contracts
 *
 * @param {String} type
 * @param {String} cid
 *
 * @return {Array} objects
 */
function getAvailableUsers(cid, type){
  var role = getRole(type);
  return new Promise(function(resolve, reject) {
    userOp.find({'cid.id': cid, 'authentication.principalRoles': role}, {name: 1, email: 1})
    .then(function(response){
      resolve(response);
    })
    .catch(function(err){
      logger.debug(err);
      reject(err);
    });
  });
}

/**
 * Get all gateways of certain type in my organisation
 *
 * @param {String} type
 * @param {String} cid
 *
 * @return {Array} objects
 */
function getAvailableGateways(cid, type){
  var gtwType = getPlatform(type);
  return new Promise(function(resolve, reject) {
    nodeOp.find({'cid.id': cid, type: gtwType}, {name: 1, adid: 1})
    .then(function(response){
      resolve(response);
    })
    .catch(function(err){
      logger.debug(err);
      reject(err);
    });
  });
}

/**
 * Notify user when transfering contract or item
 * If user transfering is not an admin
 *
 * @param {Object} uidNew
 * @param {Object} uidOld
 * @param {Object} contractOrItem
 * @param {String} type
 *
 * @return {String} Success/Error
 */
function sendNotification(uidNew, uidOld, obj, type){
  return notifHelper.createNotification(
    { kind: 'user', item: uidNew.id, extid: uidNew.extid },
    { kind: 'user', item: uidOld.id, extid: uidOld.extid },
    { kind: type, item: data.id, extid: data.ctid },
    'waiting', 41, null)
  .then(function(response){
    resolve("Success");
  })
  .catch(function(err){
    logger.debug(err);
    reject(err);
  });
}

// Private Functions

/* Roles object */
function getRole(type){
  var roles = {
    service: 'service provider',
    device: 'device owner',
    contract: 'infrastructure operator'
  };
  return roles[type];
}

/* Available platforms object */
function getPlatform(type){
  var platforms = {
    vcnt: 'generic.adapter.vicinity.eur',
    shq: 'generic.adapter.sharq.eu'
  };
  return platforms[type];
}

/* Get contract by id */
function getContract(arr, ctid){
  for(var i = 0, l = arr.length; i < l; i++){
    if(arr[i].ctid === ctid){
      return arr[i];
    }
  }
}

/* Add contracts to new user */
function addContracts(array, uid){
  return userOp.update(
    {"_id": uid.id},
    { $push: { hasContracts: { $each: array } } } )
    .then(function(response){
      for(var i = 0, l = array.length; i < l; i++){
        if(array[i].imForeign){
          return contractOp.update({"_id": array[i].id}, { $push: {"foreignIot.uid": uid} });
        } else {
          return contractOp.update({"_id": array[i].id}, { $push: {"iotOwner.uid": uid} });
        }
      }
    })
    .catch(function(err){
      logger.debug(err);
      reject(err);
    });
}

// Export Functions
module.exports.moveItem = moveItem;
module.exports.moveContract = moveContract;
module.exports.changeGateway = changeGateway;
module.exports.getAvailableUsers = getAvailableUsers;
module.exports.getAvailableGateways = getAvailableGateways;
module.exports.sendNotification = sendNotification;
