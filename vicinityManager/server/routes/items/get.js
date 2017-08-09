
// Global objects and variables

var mongoose = require('mongoose');
var itemOp = require('../../models/vicinityManager').item;
var userAccountOp = require('../../models/vicinityManager').userAccount;
var logger = require("../../middlewares/logger");
var itemProperties = require("../../helpers/items/additionalItemProperties");

/* Public functions
This module supports item data retrieval. Several items with CID or just one with OID
*/

function getMyItems(req, res) {
//TODO: User authentic - Role check
  var response = {};
  var o_id = mongoose.Types.ObjectId(req.params.cid);
  var type = req.query.type;
  var offset = req.query.offset;

  var query = {
                typeOfItem: type,
                hasAdministrator: o_id
              };

  itemOp.find(query).populate('hasAdministrator','organisation').populate('accessRequestFrom','organisation').sort({name:1}).skip(Number(offset)).limit(12).exec(function(err, data){
    var dataWithAdditional = itemProperties.getAdditional(data,o_id,[]); // Not necessary to know friends because I am always owner
    if (err) {
      logger.debug('error','Find Items Error: ' + err.message);
      response =  {"error": true, "message": "Error fetching data"};
    } else {
      response = {"error": false, "message": dataWithAdditional};
    }
    res.json(response);
  });
}


function getAllItems(req, res) {
  var response = {};
  var o_id = mongoose.Types.ObjectId(req.body.decoded_token.cid);
  var type = req.query.type;
  var offset = req.query.offset;

  userAccountOp.find({_id: o_id}, function(err, data){
    if (err){
      logger.debug('error','UserAccount Items Error: ' + err.message);
    }

    var query = {
      typeOfItem: type,
      $or :[
      {$and: [ { hasAdministrator: {$in: data[0].knows}}, { accessLevel: {$in: [2, 3, 4]} } ] },
      { accessLevel: { $gt:4 } },
      { hasAdministrator: o_id }
      ]
    };

    var friends = data[0].knows;

    itemOp.find(query).populate('hasAdministrator','organisation').sort({name:1}).skip(Number(offset)).limit(12).exec(function(err, data){
      logger.debug(JSON.stringify(data));
      if (err) {
        logger.debug('error','Find Items Error: ' + err.message);
        response =  {"error": true, "message": "Error fetching data"};
      } else {
        var dataWithAdditional = itemProperties.getAdditional(data,o_id,friends);
        response = {"error": false, "message": dataWithAdditional};
      }

      res.json(response);
    });
  });
}


function getItemWithAdd(req, res, next) {

    logger.debug('Start: getItemWithAdd');

    var response = {};
    var o_id = mongoose.Types.ObjectId(req.params.id);
    var activeCompany_id = mongoose.Types.ObjectId(req.body.decoded_token.cid);
    userAccountOp.find({_id: activeCompany_id}, function (err, data) {
      if(err){
        response = {"error": true, "message": "Processing data failed!"};
        res.json(response);
      } else {
        var friends = data[0].knows;
        itemOp.find({_id: o_id}).populate('hasAdministrator','organisation')
            .exec(
              function(err, data){
                if (err || data === null) {
                  response = {"error": true, "message": "Processing data failed!"};
                } else {
                  if (data.length === 1) {
                    var dataWithAdditional = itemProperties.getAdditional(data,activeCompany_id, friends); // Not necessary to know friends because I process only devices underRequest!
                    response = {"error": false, "message": dataWithAdditional};
                  } else {
                    response = {"error": true, "message": "Processing data failed!"};
                  }
                }
                logger.debug('End: getItemWithAdd');
                res.json(response);
              }
            );
          }
        }
      );
    }

// Function exports ================================

module.exports.getAllItems = getAllItems;
module.exports.getMyItems = getMyItems;
module.exports.getItemWithAdd = getItemWithAdd;
