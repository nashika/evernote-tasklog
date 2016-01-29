export class DataStoreService {

    user:Object = null;
    persons:Array<Object> = [];
    notebooks:Object = {};
    stacks:Array<string> = [];
    notes:Object = {};
    timeLogs:Object = {};
    profitLogs:Object = {};
    settings:Object = {};

    constructor() {
    }

}

angular.module('App').service('dataStore', [DataStoreService]);

export default DataStoreService;
