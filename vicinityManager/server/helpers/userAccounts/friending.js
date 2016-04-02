var mongoose = require('mongoose');

var userAccountOp = require('../../models/vicinityManager').userAccount;
var notificationOp = require('../../models/vicinityManager').notification;
var notificationAPI = require('../../helpers/notifications/notifications');
//TODO: Issue #6  check that only :id can make friends.
//TODO: Issue #6 Send friendship notification to :id.
//TODO: Issue #6 check double requests;
//TODO: Issue #6 check transactions;
function processFriendRequest(req, res, next) {
    debugger;
    console.log("POST /:id/friendship");
    console.log(":id " + req.params.id);
    friend_id = mongoose.Types.ObjectId(req.params.id);
    my_id = mongoose.Types.ObjectId(req.body.decoded_token.context.id);
    var friend = {};
    var me = {};
    var response = {};
    userAccountOp.find({_id: {$in: [friend_id, my_id]}}, function (err, data) {
        debugger;
        if (err || data === null) {
            response = {"error": true, "message": "Processing data failed!"};
        } else {
            if (data.length == 2) {

                var me = {};
                var friend = {};
                for (var index in data) {
                    if (data[index]._id.toString() === friend_id.toString()) {
                        friend = data[index];
                    } else {
                        me = data[index];
                    }
                }

                friend.knowsRequestsFrom.push(my_id);
                me.knowsRequestsTo.push(friend_id);

                var notification = new notificationOp();

                notification.addressedTo.push(friend._id);
                notification.sentBy = me._id;
                notification.type = 'friendRequest';
                notification.isUnread = true;
                notification.save();

                friend.hasNotifications.push(notification._id);

                friend.save();
                me.save();
                response = {"error": false, "message": "Processing data success!"};
            } else {
                response = {"error": true, "message": "Processing data failed!"};
            }
        }
        res.json(response);
    });
}

function acceptFriendRequest(req, res, next) {
    //TODO: Issue #6 :id should have authenticated user as in request list.
    //TODO: Issue #6 update knows list on :id and authenticated user side.
    //TODO: Issue #6 create new friendship story.
    //TODO: Issue #6 update friendship counts.
    console.log("Running accept friend request");
    friend_id = mongoose.Types.ObjectId(req.params.id);
    my_id = mongoose.Types.ObjectId(req.body.decoded_token.context.id);

    userAccountOp.find({_id: {$in: [friend_id, my_id]}}, function (err, data) {
        debugger;
        if (err || data === null) {
            response = {"error": true, "message": "Processing data failed!"};
        } else {
            if (data.length == 2) {
                debugger;
                var me = {};
                var friend = {};
                for (var index in data) {
                    if (data[index]._id.toString() === friend_id.toString()) {
                        friend = data[index];
                    } else {
                        me = data[index];
                    }
                }

                friend.knows.push(my_id);
                me.knows.push(friend_id);

                for (var index = friend.knowsRequestsTo.length - 1; index >= 0; index --) {
                    if (friend.knowsRequestsTo[index].toString() === my_id.toString()) {
                        friend.knowsRequestsTo.splice(index, 1);
                    }
                }

                for (var index = me.knowsRequestsFrom.length - 1; index >= 0; index --) {
                    if (me.knowsRequestsFrom[index].toString() === friend_id.toString()) {
                        me.knowsRequestsFrom.splice(index,1);
                    }
                }

                notificationAPI.markAsRead(friend_id, my_id, "friendRequest");

                friend.save();
                me.save();
                response = {"error": false, "message": "Processing data success!"};
            } else {
                response = {"error": true, "message": "Processing data failed!"};
            }
        }
        debugger;
        
        res.json(response);
    });
}

function rejectFriendRequest(req, res, next) {
    //TODO: Issue #6 remove :id from authenitcated user knows list
    //TODO: Issue #6 remove :autenticated user from :id's knows list
    //TODO: Issue #6 update friendship counts.
    console.log("Running reject friend request");
    friend_id = mongoose.Types.ObjectId(req.params.id);
    my_id = mongoose.Types.ObjectId(req.body.decoded_token.context.id);

    userAccountOp.find({_id: {$in: [friend_id, my_id]}}, function (err, data) {
        debugger;
        if (err || data === null) {
            response = {"error": true, "message": "Processing data failed!"};
        } else {
            if (data.length == 2) {
                debugger;
                var me = {};
                var friend = {};
                for (var index in data) {
                    if (data[index]._id.toString() === friend_id.toString()) {
                        friend = data[index];
                    } else {
                        me = data[index];
                    }
                }

                for (var index = friend.knowsRequestsTo.length - 1; index >= 0; index --) {
                    if (friend.knowsRequestsTo[index].toString() === my_id.toString()) {
                        friend.knowsRequestsTo.splice(index, 1);
                    }
                }

                for (var index = me.knowsRequestsFrom.length - 1; index >= 0; index --) {
                    if (me.knowsRequestsFrom[index].toString() === friend_id.toString()) {
                        me.knowsRequestsFrom.splice(index,1);
                    }
                }

                notificationAPI.markAsRead(friend_id, my_id, "friendRequest");

                friend.save();
                me.save();
                response = {"error": false, "message": "Processing data success!"};
            } else {
                response = {"error": true, "message": "Processing data failed!"};
            }
        }
        debugger;

        res.json(response);
    });
}


module.exports.processFriendRequest = processFriendRequest;
module.exports.acceptFriendRequest = acceptFriendRequest;
module.exports.rejectFriendRequest = rejectFriendRequest;