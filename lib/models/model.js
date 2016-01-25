var Datastore = require('nedb');
var inflection = require('inflection');
var core_1 = require('../core');
var Model = (function () {
    function Model(username) {
        if (username === void 0) { username = ''; }
        this._username = '';
        this._datastore = null;
        if (this.constructor.REQUIRE_USER && !username) {
            core_1["default"].loggers.system.fatal("need username.");
            process.exit(1);
        }
        var dbPath = __dirname + "/../../db/" + (username ? username + '/' : '');
        this._username = username;
        this._datastore = new Datastore({
            filename: dbPath + inflection.transform(this.constructor.PLURAL_NAME, ['underscore', 'dasherize']) + '.db',
            autoload: true
        });
    }
    Model.PLURAL_NAME = '';
    Model.TITLE_FIELD = 'name';
    Model.REQUIRE_USER = true;
    return Model;
})();
exports.__esModule = true;
exports["default"] = Model;
//# sourceMappingURL=model.js.map