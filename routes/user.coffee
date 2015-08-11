express = require 'express'
router = express.Router()

core = require '../lib/core'

router.get '/', (req, res, next) ->
  core.users[req.session.evernote.user.username].models.users.loadLocal (err, user) =>
    if err then return res.status(500).send err
    res.json user

module.exports = router
