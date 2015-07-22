express = require 'express'
router = express.Router()
Evernote = require('Evernote').Evernote

core = require '../lib/core'

router.get '/', (req, res, next) ->
  noteStore = core.client.getNoteStore()
  noteFilter = new Evernote.NoteFilter()
  resultSpec = new Evernote.NotesMetadataResultSpec()
  resultSpec.includeTitle = true
  resultSpec.includeCreated = true
  resultSpec.includeUpdated = true
  noteStore.findNotesMetadata noteFilter, 0, 10, resultSpec, (err, notesMeta) =>
    if err
      console.error err
      return
    console.log 'Found ' + notesMeta.notes.length + ' notes in your default notebook'
    for note in notesMeta.notes
      console.log note.title
    res.json notesMeta.notes

module.exports = router
