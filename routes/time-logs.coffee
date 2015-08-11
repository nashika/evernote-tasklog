express = require 'express'
router = express.Router()

core = require '../lib/core'
routeCommon = require './route-common'

router.all '/', (req, res, next) ->
  params = routeCommon.mergeParams(req)
  core.users[req.session.evernote.user.username].models.timeLogs.findLocal params, (err, timeLogs) ->
    if err then return res.status(500).send err
    res.json timeLogs

module.exports = router
