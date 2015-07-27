express = require 'express'
router = express.Router()
Evernote = require('Evernote').Evernote

NotebookModel = require '../lib/models/notebook-model'

router.get '/', (req, res, next) ->
  NotebookModel::s_findLocal {}, (err, notebooks) =>
    if err then return req.status(500).send err
    res.json notebooks

module.exports = router
