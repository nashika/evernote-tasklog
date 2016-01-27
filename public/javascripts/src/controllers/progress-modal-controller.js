var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var core_1 = require('../core');
var modal_controller_1 = require('./modal-controller');
var ProgressModalController = (function (_super) {
    __extends(ProgressModalController, _super);
    function ProgressModalController($scope, progress) {
        _super.call(this, $scope);
        this.$scope = $scope;
        this.progress = progress;
        this.$scope['progress'] = this.progress;
    }
    return ProgressModalController;
})(modal_controller_1["default"]);
core_1["default"].app.controller('ProgressModalController', ['$scope', 'progress', ProgressModalController]);
exports.__esModule = true;
exports["default"] = ProgressModalController;
//# sourceMappingURL=progress-modal-controller.js.map