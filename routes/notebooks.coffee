express = require 'express'
router = express.Router()

core = require '../lib/core'

router.get '/', (req, res, next) ->
  core.users[req.session.evernote.user.username].models.notebooks.findLocal req.query, (err, notebooks) =>
    if err then return req.status(500).send err
    res.json notebooks

module.exports = router
