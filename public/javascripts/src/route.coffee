app.config ['$routeProvider', ($routeProvider) ->
  $routeProvider
  .when '/',
    templateUrl: 'menu'
  .when '/timeline',
    templateUrl: 'timeline'
  .when '/notes',
    templateUrl: 'notes'
  .when '/settings',
    templateUrl: 'settings'
  .otherwise
    redirectTo: '/'
]
