express = require 'express'
router = express.Router()
Evernote = require('Evernote').Evernote

core = require '../lib/core'

router.get '/', (req, res, next) ->
  noteStore = core.client.getNoteStore()
  noteStore.getNote req.query.guid, true, false, false, false, (err, note) =>
    if err then return res.status(500).send err
    res.json note

module.exports = router
