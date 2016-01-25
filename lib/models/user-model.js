var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var core_1 = require('../core');
var single_model_1 = require('./single-model');
var UserModel = (function (_super) {
    __extends(UserModel, _super);
    function UserModel() {
        _super.apply(this, arguments);
    }
    UserModel.prototype.loadRemote = function (callback) {
        var userStore = core_1["default"].users[this._username].client.getUserStore();
        userStore.getUser(callback);
    };
    UserModel.PLURAL_NAME = 'users';
    UserModel.DEFAULT_DOC = {};
    return UserModel;
})(single_model_1["default"]);
exports.__esModule = true;
exports["default"] = UserModel;
//# sourceMappingURL=user-model.js.map