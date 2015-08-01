# angular.js setting
window.app = angular.module('App', ['ngRoute', 'ui.bootstrap'])

# route settings
window.app.config ['$routeProvider', ($routeProvider) ->
  $routeProvider
    .when '/',
      redirectTo: '/timeline'
    .when '/timeline',
      templateUrl: 'timeline'
    .when '/settings',
      templateUrl: 'settings'
    .otherwise
      redirectTo: '/'
]

# angular.js filters
require './filters/order-object-by'

# angular.js services
require './services/progress'

# angular.js directives
require './directives/resize'

# angular.js controllers
require './controllers/controller'
require './controllers/navigation-controller'
require './controllers/timeline-controller'
require './controllers/settings-controller'
require './controllers/progress-modal-controller'
