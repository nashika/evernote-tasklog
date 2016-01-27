import core from '../core';

class DataStoreService {

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

core.app.service('dataStore', [DataStoreService]);

export default DataStoreService;
