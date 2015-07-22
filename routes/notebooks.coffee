express = require 'express'
router = express.Router()
Evernote = require('Evernote').Evernote

core = require '../lib/core'

router.get '/', (req, res, next) ->
  noteStore = core.client.getNoteStore()
  noteStore.listNotebooks (err, notebooks) =>
    if err
      console.error err
      return
    res.json notebooks

module.exports = router
