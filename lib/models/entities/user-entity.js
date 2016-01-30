var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var evernote = require("evernote");
var UserEntity = (function (_super) {
    __extends(UserEntity, _super);
    function UserEntity() {
        _super.apply(this, arguments);
    }
    return UserEntity;
})(evernote.Evernote.User);
exports.UserEntity = UserEntity;
//# sourceMappingURL=user-entity.js.map