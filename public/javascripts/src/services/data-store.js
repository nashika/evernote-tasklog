var core_1 = require('../core');
var DataStoreService = (function () {
    function DataStoreService() {
        this.user = null;
        this.persons = [];
        this.notebooks = {};
        this.stacks = [];
        this.notes = {};
        this.timeLogs = {};
        this.profitLogs = {};
        this.settings = {};
    }
    return DataStoreService;
})();
core_1["default"].app.service('dataStore', [DataStoreService]);
exports.__esModule = true;
exports["default"] = DataStoreService;
//# sourceMappingURL=data-store.js.map