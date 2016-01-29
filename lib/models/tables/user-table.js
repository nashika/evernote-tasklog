var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var core_1 = require('../../core');
var single_table_1 = require('./single-table');
var user_entity_1 = require("../entities/user-entity");
var UserTable = (function (_super) {
    __extends(UserTable, _super);
    function UserTable() {
        _super.apply(this, arguments);
    }
    UserTable.prototype.loadRemote = function (callback) {
        var userStore = core_1["default"].users[this._username].client.getUserStore();
        userStore.getUser(callback);
    };
    UserTable.PLURAL_NAME = 'users';
    UserTable.DEFAULT_DOC = new user_entity_1["default"]();
    return UserTable;
})(single_table_1["default"]);
exports.__esModule = true;
exports["default"] = UserTable;
//# sourceMappingURL=user-table.js.map