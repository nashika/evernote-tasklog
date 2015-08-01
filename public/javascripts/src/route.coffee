app.config ['$routeProvider', ($routeProvider) ->
  $routeProvider
  .when '/',
    redirectTo: '/timeline'
  .when '/timeline',
    templateUrl: 'timeline'
  .when '/notes',
    templateUrl: 'notes'
  .when '/settings',
    templateUrl: 'settings'
  .otherwise
      redirectTo: '/'
]
