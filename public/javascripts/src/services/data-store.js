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
//# sourceMappingURL=data-store.js.map