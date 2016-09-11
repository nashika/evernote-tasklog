import _ = require("lodash");

export default {

  mergeParams(req: {body: any, query: any}): Object {
    var body = req['body'] || {};
    var query = req['query'] || {};
    return _.merge({}, body, query);
  }

}
