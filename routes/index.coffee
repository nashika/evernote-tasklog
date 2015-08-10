express = require 'express'
Evernote = require('evernote').Evernote

core = require '../lib/core'
config = require '../config'

router = express.Router()

### GET home page. ###
router.get '/', (req, res, next) ->
  if not req.session.evernote?.accessToken
    res.redirect '/login'
  else
    token = req.session.evernote.accessToken
    client = new Evernote.Client
      token: token
      sandbox: config.sandbox
    userStore = client.getUserStore()
    userStore.getUser (err, user) ->
      if err then return res.redirect('/login')
      req.session.evernote.user = user
      req.session.save ->
        core.www.initUser user.username, token, config.sandbox, ->
          res.render 'index', title: 'Evernote Tasklog'

router.get '/login', (req, res, next) ->
  client = new Evernote.Client
    consumerKey: config.consumerKey
    consumerSecret: config.consumerSecret
    sandbox: config.sandbox
  client.getRequestToken "#{req.protocol}://#{req.get('host')}/login_callback", (error, oauthToken, oauthTokenSecret, results) ->
    if error then return res.status(500).send "Error getting OAuth request token : " + JSON.stringify(error)
    req.session.evernote = {authTokenSecret: oauthTokenSecret}
    req.session.save ->
      res.redirect client.getAuthorizeUrl(oauthToken)

router.get '/login_callback', (req, res, next) ->
  oauthToken = req.query['oauth_token']
  oauthVerifier = req.query['oauth_verifier']
  oauthTokenSecret = req.session.evernote?.authTokenSecret
  if not oauthToken or not oauthVerifier or not oauthTokenSecret
    res.redirect '/login'
    return
  client = new Evernote.Client
    consumerKey: config.consumerKey
    consumerSecret: config.consumerSecret
    sandbox: config.sandbox
  client.getAccessToken oauthToken, oauthTokenSecret, oauthVerifier, (error, oauthAccessToken, oauthAccessTokenSecret, results) ->
    req.session.evernote.accessToken = oauthAccessToken
    req.session.save ->
      res.redirect '/'

router.get '/logout', (req, res, next) ->
  req.session.evernote = undefined
  req.session.save ->
    res.redirect '/'

module.exports = router
