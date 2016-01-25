var Datastore:any = require('nedb');
import * as inflection from 'inflection';

export default class Model {

    PLURAL_NAME: string = '';

    TITLE_FIELD: string = 'name';

    REQUIRE_USER: boolean = true;

    protected _username: string = '';

    protected _datastore: any = null;

    constructor(username: string = '') {
        if (this.REQUIRE_USER && !username) {
            throw new Error(`${this.constructor} need username.`);
            return;
        }
        var dbPath = `${__dirname}/../../db/${username ? username + '/' : ''}`;
        this._username = username;
        this._datastore = new Datastore({
            filename: dbPath + inflection.transform(this.PLURAL_NAME, ['underscore', 'dasherize']) + '.db',
            autoload: true
        });
    }

}
