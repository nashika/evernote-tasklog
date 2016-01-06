class NavigationController

  constructor: (@$scope, @$rootScope, @$route) ->
    @$scope.navCollapse = true
    @$scope.$route = @$route
    @$scope.reload = @_reload

  _reload: =>
    @$rootScope.$broadcast 'event::reload'

app.controller 'NavigationController', ['$scope', '$rootScope', '$route', NavigationController]
module.exports = NavigationController
