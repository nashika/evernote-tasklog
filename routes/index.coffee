express = require 'express'
Evernote = require('evernote').Evernote

config = require '../config'

router = express.Router()

### GET home page. ###
router.get '/', (req, res, next) ->
  res.render 'index', title: 'Evernote Tasklog'

module.exports = router
