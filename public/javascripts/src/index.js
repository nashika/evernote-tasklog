// Generated by CoffeeScript 1.9.3
(function() {
  window.app = angular.module('App', ['ngRoute', 'ui.bootstrap']);

  window.app.config([
    '$routeProvider', function($routeProvider) {
      return $routeProvider.when('/', {
        redirectTo: '/timeline'
      }).when('/timeline', {
        templateUrl: 'timeline'
      }).when('/settings', {
        templateUrl: 'settings'
      }).otherwise({
        redirectTo: '/'
      });
    }
  ]);

  require('./filters/order-object-by');

  require('./factories/view-util');

  require('./directives/resize');

  require('./controllers/controller');

  require('./controllers/navigation-controller');

  require('./controllers/timeline-controller');

  require('./controllers/settings-controller');

}).call(this);

//# sourceMappingURL=index.js.map
