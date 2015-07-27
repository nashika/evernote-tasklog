express = require 'express'
router = express.Router()

www = require '../lib/www'

router.get '/', (req, res, next) ->
  www.sync (err) =>
    if err then return res.status(500).send err
    res.json 'OK'

module.exports = router
