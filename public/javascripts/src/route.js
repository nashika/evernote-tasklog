// Generated by CoffeeScript 1.9.3
(function() {
  app.config([
    '$routeProvider', function($routeProvider) {
      return $routeProvider.when('/', {
        redirectTo: '/timeline'
      }).when('/timeline', {
        templateUrl: 'timeline'
      }).when('/notes', {
        templateUrl: 'notes'
      }).when('/settings', {
        templateUrl: 'settings'
      }).otherwise({
        redirectTo: '/'
      });
    }
  ]);

}).call(this);

//# sourceMappingURL=route.js.map
