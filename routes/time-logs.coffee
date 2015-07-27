express = require 'express'
router = express.Router()

core = require '../lib/core'
TimeLogModel = require '../lib/models/time-log-model'

router.get '/', (req, res, next) ->
  query = if req.query.query then JSON.parse(req.query.query) else {}
  TimeLogModel::s_findLocal query, (err, timeLogs) =>
    if err then return res.status(500).send err
    res.json timeLogs

module.exports = router
