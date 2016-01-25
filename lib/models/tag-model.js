var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var multi_model_1 = require('./multi-model');
var TagModel = (function (_super) {
    __extends(TagModel, _super);
    function TagModel() {
        _super.apply(this, arguments);
    }
    TagModel.PLURAL_NAME = 'tags';
    return TagModel;
})(multi_model_1["default"]);
exports.__esModule = true;
exports["default"] = TagModel;
//# sourceMappingURL=tag-model.js.map