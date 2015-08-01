express = require 'express'
router = express.Router()

core = require '../lib/core'
NoteModel = require '../lib/models/note-model'

router.get '/', (req, res, next) ->
  NoteModel::s_findLocal req.query, (err, notes) =>
    if err then return res.status(500).send err
    res.json notes

router.get '/get-content', (req, res, next) ->
  NoteModel::s_getRemoteContent req.query, (err, result) =>
    if err then return res.status(500).send err
    res.json result

router.get '/count', (req, res, next) ->
  NoteModel::s_countLocal req.query, (err, count) ->
    if err then return res.status(500).send err
    res.json count

module.exports = router
