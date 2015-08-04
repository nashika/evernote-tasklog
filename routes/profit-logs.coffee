express = require 'express'
router = express.Router()

routeCommon = require './route-common'
ProfitLogModel = require '../lib/models/profit-log-model'

router.all '/', (req, res, next) ->
  params = routeCommon.mergeParams(req)
  ProfitLogModel::s_findLocal params, (err, profitLogs) ->
    if err then return res.status(500).send err
    res.json profitLogs

module.exports = router
