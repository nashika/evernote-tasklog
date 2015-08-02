express = require 'express'
router = express.Router()

routeCommon = require './route-common'
TimeLogModel = require '../lib/models/time-log-model'

router.all '/', (req, res, next) ->
  params = routeCommon.mergeParams(req)
  TimeLogModel::s_findLocal params, (err, timeLogs) ->
    if err then return res.status(500).send err
    res.json timeLogs

module.exports = router
