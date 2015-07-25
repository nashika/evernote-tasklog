express = require 'express'
router = express.Router()

core = require '../lib/core'

router.get '/', (req, res, next) ->
  core.db.notes.find {}, (err, notes) =>
    if err then return res.status(500).send err
    res.json notes

module.exports = router
