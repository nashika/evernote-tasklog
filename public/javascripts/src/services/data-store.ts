import core from '../core';

class DataStoreService {

    user:Object = null;
    persons:Array<Object> = [];
    notebooks:any = {};
    stacks:Array<string> = [];
    notes:any = {};
    timeLogs:Object = {};
    profitLogs:Object = {};
    settings:Object = {};

    constructor() {
    }

}

core.app.service('dataStore', [DataStoreService]);

export default DataStoreService;
