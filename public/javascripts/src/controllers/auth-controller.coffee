class AuthController

  constructor: (@$scope, @$http) ->
    @$scope.message = null
    @$scope.isDeveloper = false
    @$scope.sandbox = {token: null, username: null}
    @$scope.production = {token: null, username: null}
    @$scope.setToken = @_setToken
    @_init()

  _init: =>
    @$http.get '/auth/token'
    .error (data) =>
      throw new Error(data)
    .success (data) =>
      @$scope.production = data
      @$http.post '/auth/token', {sandbox: true}
      .error (data) =>
        throw new Error(data)
      .success (data) =>
        @$scope.sandbox = data

  _setToken: (sandbox) =>
    token = prompt "Input developer token (#{if sandbox then 'sandbox' else 'production'})"
    if not token then return
    @$http.post '/auth/token', {sandbox: sandbox, token: token}
    .success (data) =>
      if sandbox
        @$scope.sandbox = data
      else
        @$scope.production = data
      if not data then alert 'Token is invalid.'
    .error (data) => alert 'Set token failed.'

app.controller 'AuthController', ['$scope', '$http', AuthController]
module.exports = AuthController
