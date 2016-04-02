var mongoose = require('mongoose');

var ObjectId = mongoose.Schema.Types.ObjectId;

var userAccount = {
  email: String,
  avatar: String,
  authentication: {
    password: String,
    principalRoles: [String]},
  creatorOf: [ObjectId], //Creator of UserAccounts
  follows: [ObjectId], //Follows UserAccounts
  memberOf: [ObjectId], //Member of UserGroups
  accountOf: {
    name: String,
    firstName: String,
    surname: String,
    lastName: String,
    occupation: String,
    location: String,
    organisation: String}, //UserAccount is account of Agent
  knows: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'userAccount'
    }],
    knowsRequestsFrom: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'userAccount'
    }],
    knowsRequestsTo: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'userAccount'
    }],
    hasNotifications: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'notification'
    }],
  modifierOf: [ObjectId], //UserAccount is modifier of Item, Container or Space
  administratorOf: [ObjectId], //UserAccount is administrator of Item, Container or Space
  badges:[String],
  notes:String
};

var notification = {
    addressedTo: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'userAccount'
    }],
    sentBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'userAccount'
    },
    type: {type: String, enum: ['friendRequest']},
    isUnread: Boolean
};

var userGroup = {
  name: String,
  avatar: String,
  hasAdministrator: [ObjectId]
};

var organisationUnit = {
  name: String,
  consistsOf: [ObjectId] // OrganisationUnit consist of Gateways
};

var gateway = {
  name: String,
  consistsOf: [ObjectId] // Gateway has Items.
};

var item = {
  name: String,
  consistsOf: {type: String, id: [ObjectId]} // Item has items.
};

module.exports.userAccount = mongoose.model('userAccount', userAccount);
module.exports.userGroup = mongoose.model('userGroup', userGroup);
module.exports.organisationUnit = mongoose.model('organisationUnit', organisationUnit);
module.exports.gateway = mongoose.model('gateway', gateway);
module.exports.item = mongoose.model('item', item);
module.exports.notification = mongoose.model('notification', notification);