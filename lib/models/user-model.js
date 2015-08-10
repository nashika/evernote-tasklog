// Generated by CoffeeScript 1.9.3
(function() {
  var SingleModel, UserModel, core,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  core = require('../core');

  SingleModel = require('./single-model');

  UserModel = (function(superClass) {
    extend(UserModel, superClass);

    function UserModel() {
      this.s_loadRemote = bind(this.s_loadRemote, this);
      return UserModel.__super__.constructor.apply(this, arguments);
    }


    /**
     * @override
     */

    UserModel.prototype.PLURAL_NAME = 'users';


    /**
     * @override
     */

    UserModel.prototype.DEFAULT_DOC = {};


    /**
     * @public
     * @static
     * @param {string} username
     * @param {function} callback
     */

    UserModel.prototype.s_loadRemote = function(username, callback) {
      var userStore;
      userStore = core.users[username].client.getUserStore();
      return userStore.getUser(callback);
    };

    return UserModel;

  })(SingleModel);

  module.exports = UserModel;

}).call(this);

//# sourceMappingURL=user-model.js.map