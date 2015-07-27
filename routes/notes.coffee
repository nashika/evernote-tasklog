express = require 'express'
router = express.Router()

core = require '../lib/core'
NoteModel = require '../lib/models/note-model'

router.get '/', (req, res, next) ->
  query = if req.query.query then JSON.parse(req.query.query) else {}
  if req.query.content
    NoteModel::s_findLocalWithContent query, (err, notes) =>
      if err then return res.status(500).send err
      res.json notes
  else
    NoteModel::s_findLocalWithoutContent query, (err, notes) =>
      if err then return res.status(500).send err
      res.json notes

module.exports = router
