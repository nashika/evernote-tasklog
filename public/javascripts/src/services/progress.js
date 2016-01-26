var core_1 = require('../core');
var ProgressService = (function () {
    function ProgressService($modal) {
        this.$modal = $modal;
        this.modalInstance = null;
        this.value = 0;
        this.completeCount = 0;
        this.allCount = 0;
        this.message = '';
    }
    ProgressService.prototype.open = function (allCount) {
        this.message = 'processing...';
        this.value = 0;
        this.completeCount = 0;
        this.allCount = allCount;
        this.modalInstance = this.$modal.open({
            templateUrl: 'progress-modal',
            controller: 'ProgressModalController',
            backdrop: 'static',
            keyboard: false,
            size: 'sm',
            animation: false
        });
    };
    ProgressService.prototype.close = function () {
        this.modalInstance.close();
    };
    ProgressService.prototype.set = function (message, value) {
        if (value === void 0) { value = null; }
        this.message = message;
        if (value !== null)
            this.value = value;
    };
    ProgressService.prototype.next = function (message) {
        this.completeCount++;
        this.set(message, this.completeCount / this.allCount * 100);
    };
    return ProgressService;
})();
core_1["default"].app.service('progress', ['$modal', ProgressService]);
exports.__esModule = true;
exports["default"] = ProgressService;
//# sourceMappingURL=progress.js.map