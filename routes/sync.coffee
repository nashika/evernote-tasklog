express = require 'express'
router = express.Router()

www = require '../lib/www'

router.get '/', (req, res, next) ->
  www.sync req.session.evernote.user.username, (err) =>
    if err then return res.status(500).send err
    res.json 'OK'

module.exports = router
