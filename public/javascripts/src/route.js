angular.module('App').config(['$routeProvider', function ($routeProvider) {
        $routeProvider
            .when('/', {
            templateUrl: 'menu'
        })
            .when('/timeline', {
            templateUrl: 'timeline'
        })
            .when('/notes', {
            templateUrl: 'notes'
        })
            .when('/settings', {
            templateUrl: 'settings'
        })
            .otherwise({
            redirectTo: '/'
        });
    }]);
//# sourceMappingURL=route.js.map