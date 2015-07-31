async = require 'async'

class NavigationController

  constructor: (@$scope, @$route) ->
    @$scope.navCollapse = true
    @$scope.$route = @$route

app.controller 'NavigationController', ['$scope', '$route', NavigationController]
module.exports = NavigationController
