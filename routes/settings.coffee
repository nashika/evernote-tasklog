express = require 'express'
router = express.Router()

core = require '../lib/core'

router.get '/', (req, res, next) ->
  if not req.query.key then return res.status(500).send 'Read settings need key parameter.'
  core.users[req.session.evernote.user.username].models.settings.loadLocal req.query.key, (err, setting) =>
    if err then return res.status(500).send err
    res.json setting

router.put '/save', (req, res, next) ->
  if not req.body.key then return res.status(500).send 'No key.'
  if not req.body.data then return res.status(500).send 'No data.'
  core.users[req.session.evernote.user.username].models.settings.saveLocal req.body.key, req.body.data, (err) =>
    if err then return res.status(500).send err
    res.json true

module.exports = router
