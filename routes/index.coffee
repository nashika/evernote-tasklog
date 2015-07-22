express = require('express')
Evernote = require('evernote').Evernote

config = require '../config'

router = express.Router()

### GET home page. ###
router.get '/', (req, res, next) ->
  client = new Evernote.Client
    consumerKey: config.consumerKey
    consumerSecret: config.consumerSecret
    sandbox: true

  ###
  client.getRequestToken 'http://localhost:3000', (error, oauthToken, oauthTokenSecret, results) =>
    if error
      res.send 'Error getting OAuth request token. error=' + JSON.stringify(error), 500
      return
    res.cookie 'oauthTokenSecret', oauthTokenSecret
    res.redirect client.getAuthorizeUrl(oauthToken)
    return
  ###

  client = new Evernote.Client
    token: config.developerToken
  userStore = client.getUserStore()
  userStore.getUser (error, user) =>
    console.log JSON.stringify(user)
  noteStore = client.getNoteStore()
  noteStore.findNotes config.developerToken, new Evernote.NoteFilter(), 0, 10,

  res.render 'index', title: 'Express'
  return

module.exports = router
