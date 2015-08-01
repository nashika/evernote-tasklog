express = require 'express'
router = express.Router()

core = require '../lib/core'
TimeLogModel = require '../lib/models/time-log-model'

router.get '/', (req, res, next) ->
  TimeLogModel::s_findLocal req.query, (err, timeLogs) =>
    if err then return res.status(500).send err
    res.json timeLogs

module.exports = router
