"use strict";
var merge = require('merge');
exports.__esModule = true;
exports["default"] = {
    mergeParams: function (req) {
        var body = req['body'] || {};
        var query = req['query'] || {};
        return merge(true, body, query);
    }
};
//# sourceMappingURL=route-common.js.map