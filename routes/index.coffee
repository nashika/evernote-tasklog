express = require 'express'
Evernote = require('evernote').Evernote

core = require '../lib/core'
config = require '../config'

router = express.Router()

### GET home page. ###
router.get '/', (req, res, next) ->
  if not req.session.evernote?.accessToken
    res.redirect '/auth'
  else
    sandbox = req.session.evernote.sandbox
    token = req.session.evernote.accessToken
    client = new Evernote.Client
      token: token
      sandbox: sandbox
    userStore = client.getUserStore()
    userStore.getUser (err, user) ->
      if err then return res.redirect('/auth')
      req.session.evernote.user = user
      req.session.save ->
        core.www.initUser user.username, token, sandbox, ->
          res.render 'index', title: 'Evernote Tasklog'

module.exports = router
