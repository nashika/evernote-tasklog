express = require 'express'
router = express.Router()

core = require '../lib/core'

router.get '/', (req, res, next) ->
  key = req.query.key ? null
  core.users[req.session.evernote.user.username].models.settings.loadLocal key, (err, settings) =>
    if err then return res.status(500).send err
    res.json settings

router.put '/save', (req, res, next) ->
  if not req.body.key then return res.status(500).send 'No key.'
  if not req.body.value then return res.status(500).send 'No value.'
  core.users[req.session.evernote.user.username].models.settings.saveLocal req.body.key, req.body.value, (err) =>
    if err then return res.status(500).send err
    res.json true

module.exports = router
