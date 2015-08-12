express = require 'express'
router = express.Router()

core = require '../lib/core'

router.get '/', (req, res, next) ->
  core.users[req.session.evernote.user.username].models.notebooks.findLocal req.query, (err, notebooks) =>
    if err then return req.status(500).send err
    res.json notebooks

router.put '/save', (req, res, next) ->
  if not req.body.key then return req.status(500).send 'No key.'
  if not req.body.data then return req.status(500).send 'No data.'
  core.users[req.session.evernote.user.username].models.settings.saveLocal req.body.key, req.body.data, (err) =>
    if err then return req.status(500).send err
    res.json true

module.exports = router
