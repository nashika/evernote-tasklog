express = require 'express'
router = express.Router()
Evernote = require('Evernote').Evernote

core = require '../lib/core'

router.get '/', (req, res, next) ->
  noteStore = core.client.getNoteStore()
  noteStore.getNote req.query.guid, true, false, false, false, (err, note) =>
    if err then res.send err, 500
    res.json note

router.get '/content', (req, res, next) ->
  noteStore = core.client.getNoteStore()
  noteStore.getNoteContent req.query.guid, (err, content) =>
    if err then res.send err, 500
    res.json content

module.exports = router
