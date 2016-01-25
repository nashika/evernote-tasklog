var Datastore = require('nedb');
var inflection = require('inflection');
var Model = (function () {
    function Model(username) {
        if (username === void 0) { username = ''; }
        this.PLURAL_NAME = '';
        this.TITLE_FIELD = 'name';
        this.REQUIRE_USER = true;
        this._username = '';
        this._datastore = null;
        if (this.REQUIRE_USER && !username) {
            throw new Error(this.constructor + " need username.");
            return;
        }
        var dbPath = __dirname + "/../../db/" + (username ? username + '/' : '');
        this._username = username;
        this._datastore = new Datastore({
            filename: dbPath + inflection.transform(this.PLURAL_NAME, ['underscore', 'dasherize']) + '.db',
            autoload: true
        });
    }
    return Model;
})();
exports.__esModule = true;
exports["default"] = Model;
//# sourceMappingURL=model.js.map