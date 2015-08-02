merge = require 'merge'

class RouteCommon

  mergeParams: (req) =>
    body = req.body ? {}
    query = req.query ? {}
    return merge true, body, query

module.exports = new RouteCommon()
