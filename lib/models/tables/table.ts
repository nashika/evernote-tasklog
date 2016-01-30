import Datastore = require("nedb");
import * as inflection from 'inflection';

import core from '../../core';

export class Table {

    static PLURAL_NAME:string = '';

    static TITLE_FIELD:string = 'name';

    static REQUIRE_USER:boolean = true;

    protected _username:string = '';

    protected _datastore:any = null;

    constructor(username:string = '') {
        if ((<typeof Table>this.constructor).REQUIRE_USER && !username) {
            core.loggers.system.fatal(`need username.`);
            process.exit(1);
        }
        var dbPath = `${__dirname}/../../../db/${username ? username + '/' : ''}`;
        this._username = username;
        this._datastore = new Datastore({
            filename: dbPath + inflection.transform((<typeof Table>this.constructor).PLURAL_NAME, ['underscore', 'dasherize']) + '.db',
            autoload: true
        });
    }

}
