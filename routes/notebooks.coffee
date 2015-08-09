express = require 'express'
router = express.Router()

NotebookModel = require '../lib/models/notebook-model'

router.get '/', (req, res, next) ->
  NotebookModel::s_findLocal req.session.evernote.user.username, req.query, (err, notebooks) =>
    if err then return req.status(500).send err
    res.json notebooks

module.exports = router
