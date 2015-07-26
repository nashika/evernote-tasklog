express = require 'express'
router = express.Router()

core = require '../lib/core'
NoteModel = require '../lib/models/note-model'

router.get '/', (req, res, next) ->
  NoteModel::s_find {}, (err, notes) =>
    if err then return res.status(500).send err
    res.json notes

module.exports = router
