express = require 'express'
router = express.Router()

core = require '../lib/core'

router.get '/', (req, res, next) ->
  userStore = core.client.getUserStore()
  userStore.getUser (err, user) =>
    if err
      res.json err
    res.json user

module.exports = router
