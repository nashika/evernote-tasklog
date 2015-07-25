express = require 'express'
router = express.Router()

config = require '../config'

router.get '/', (req, res, next) ->
  res.json config.persons

module.exports = router
