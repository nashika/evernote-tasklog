express = require 'express'
router = express.Router()

core = require '../lib/core'

router.get '/', (req, res, next) ->
  core.users[req.session.evernote.user.username].models.notes.findLocal req.query, (err, notes) =>
    if err then return res.status(500).send err
    res.json notes

router.get '/get-content', (req, res, next) ->
  core.users[req.session.evernote.user.username].models.notes.getRemoteContent req.query, (err, result) =>
    if err then return res.status(500).send err
    res.json result

router.get '/count', (req, res, next) ->
  core.users[req.session.evernote.user.username].models.notes.countLocal req.query, (err, count) ->
    if err then return res.status(500).send err
    res.json count

module.exports = router
