express = require 'express'
router = express.Router()
Evernote = require('Evernote').Evernote

core = require '../lib/core'

router.get '/', (req, res, next) ->
  noteStore = core.client.getNoteStore()
  noteFilter = new Evernote.NoteFilter()
  if req.query.words then noteFilter.words = req.query.words
  resultSpec = new Evernote.NotesMetadataResultSpec()
  resultSpec.includeTitle = true
  resultSpec.includeCreated = true
  resultSpec.includeUpdated = true
  noteStore.findNotesMetadata noteFilter, 0, 10, resultSpec, (err, notesMeta) =>
    if err then return res.status(500).send err
    res.json notesMeta.notes

module.exports = router
