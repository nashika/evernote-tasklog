express = require 'express'
router = express.Router()

UserModel = require '../lib/models/user-model'

router.get '/', (req, res, next) ->
  UserModel::s_loadLocal (err, user) =>
    if err then return res.status(500).send err
    res.json user

module.exports = router
