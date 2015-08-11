express = require 'express'
Evernote = require('evernote').Evernote

core = require '../lib/core'
config = require '../config'

router = express.Router()

router.get '/', (req, res, next) ->
  res.render 'auth', title: 'Login'

router.get '/login', (req, res, next) ->
  sandbox = if req.query.sandbox then true else false
  token = if req.query.token then true else false
  envConfig = if sandbox then config.env.sandbox else config.env.production
  if token
    key = if sandbox then 'token.sandbox' else 'token.production'
    core.models.settings.loadLocal key, (err, setting) ->
      if setting
        developerToken = setting.token
        req.session.evernote =
          sandbox: sandbox
          token: developerToken
        req.session.save ->
          res.redirect '/'
  else
    client = new Evernote.Client
      consumerKey: envConfig.consumerKey
      consumerSecret: envConfig.consumerSecret
      sandbox: sandbox
    client.getRequestToken "#{req.protocol}://#{req.get('host')}/auth/callback", (error, oauthToken, oauthTokenSecret, results) ->
      if error then return res.status(500).send "Error getting OAuth request token : " + JSON.stringify(error)
      req.session.evernote =
        sandbox: sandbox
        authTokenSecret: oauthTokenSecret
      req.session.save ->
        res.redirect client.getAuthorizeUrl(oauthToken)

router.get '/callback', (req, res, next) ->
  oauthToken = req.query['oauth_token']
  oauthVerifier = req.query['oauth_verifier']
  oauthTokenSecret = req.session.evernote?.authTokenSecret
  sandbox = req.session.evernote?.sandbox
  if not oauthToken or not oauthVerifier or not oauthTokenSecret
    res.redirect '/auth'
    return
  envConfig = if sandbox then config.env.sandbox else config.env.production
  client = new Evernote.Client
    consumerKey: envConfig.consumerKey
    consumerSecret: envConfig.consumerSecret
    sandbox: sandbox
  client.getAccessToken oauthToken, oauthTokenSecret, oauthVerifier, (error, oauthAccessToken, oauthAccessTokenSecret, results) ->
    req.session.evernote.token = oauthAccessToken
    req.session.save ->
      res.redirect '/'

router.get '/logout', (req, res, next) ->
  req.session.evernote = undefined
  req.session.save ->
    res.redirect '/auth'

router.all '/token', (req, res, next) ->
  sandbox = if req.body.sandbox ? req.body.sandbox then true else false
  token = req.body.token ? req.query.token
  checkToken = (sandbox, token) ->
    if not token then return res.json null
    _client = new Evernote.Client
      token: token
      sandbox: sandbox
    _userStore = _client.getUserStore()
    _userStore.getUser (err, user) ->
      if err then return res.json null
      res.json {token: token, username: user.username}
  key = if sandbox then 'token.sandbox' else 'token.production'
  if token
    doc = {token: token}
    core.models.settings.saveLocal key, doc, (err) =>
      if err then return res.status(500).send "Error upsert token : #{JSON.stringify(err)}"
      checkToken sandbox, token
  else
    core.models.settings.loadLocal key, (err, setting) =>
      if err then return res.status(500).send "Error find token: #{JSON.stringify(err)}"
      token = if setting then setting.token else null
      checkToken sandbox, token

module.exports = router
