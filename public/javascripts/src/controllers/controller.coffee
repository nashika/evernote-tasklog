class Controller
  constructor: (@$scope, @viewUtil) ->

app.controller 'Controller', ['$scope', 'viewUtil', Controller]
module.exports = Controller
