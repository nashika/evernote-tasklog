express = require 'express'
router = express.Router()

core = require '../lib/core'

router.get '/', (req, res, next) ->
  core.db.timeLogs.find {}, (err, timeLogs) =>
    if err then return res.status(500).send err
    res.json timeLogs

module.exports = router
