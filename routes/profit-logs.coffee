express = require 'express'
router = express.Router()

core = require '../lib/core'
routeCommon = require './route-common'

router.all '/', (req, res, next) ->
  params = routeCommon.mergeParams(req)
  core.users[req.session.evernote.user.username].models.profitLogs.findLocal params, (err, profitLogs) ->
    if err then return res.status(500).send err
    res.json profitLogs

module.exports = router
