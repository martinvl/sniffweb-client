var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;
var Q = require('q');
var socketIO = require('socket.io-client');
var token = require('sniffweb-token');
var _ = require('underscore');

function SniffwebClient(host, port) {
    this.tasks = [];
    this.socket = socketIO('http://' + host + ':' + port);

    var self = this;
    this.socket.on('tasks', function (tasks) {
        self.tasks = tasks;
        self.emit('update');

        self.socket.on('added_claim', function (payload) {
            self.addClaimToTask(payload.claim, payload.taskId);
            self.emit('update');
        });
    });
}

inherits(SniffwebClient, EventEmitter);
module.exports = SniffwebClient;

SniffwebClient.prototype.claim = function (taskId, key, name) {
    var deferred = Q.defer();
    var payload = {
        taskId: taskId,
        token: token.generate(key, name),
        name: name
    };

    this.socket.emit('claim', payload, function (success) {
        deferred.resolve(success);
    });

    return deferred.promise;
};

SniffwebClient.prototype.addClaimToTask = function (claim, taskId) {
    var task = this.getTask(taskId);
    task.claims.push(claim);
};

SniffwebClient.prototype.getTask = function (id) {
    for (var idx in this.tasks) {
        var task = this.tasks[idx];

        if (task.id === id) {
            return task;
        }
    }
};
