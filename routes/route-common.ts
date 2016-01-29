var merge = require('merge');

export default {

    mergeParams(req:Object):Object {
        var body = req['body'] || {};
        var query = req['query'] || {};
        return merge(true, body, query);
    }

}
