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
exports.DataStoreService = DataStoreService;
angular.module('App').service('dataStore', [DataStoreService]);
exports.__esModule = true;
exports["default"] = DataStoreService;
//# sourceMappingURL=data-store.js.map