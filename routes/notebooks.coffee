express = require 'express'
router = express.Router()
Evernote = require('Evernote').Evernote

core = require '../lib/core'

router.get '/', (req, res, next) ->
  noteStore = core.client.getNoteStore()
  noteStore.listNotebooks (err, notebooks) =>
    if err then return req.status(500).send err
    res.json notebooks

module.exports = router
