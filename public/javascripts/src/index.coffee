# angular.js setting
window.app = angular.module('App', ['ngRoute', 'ui.bootstrap', 'ngSanitize', 'ui.select'])

app.config ['$compileProvider', ($compileProvider) ->
  $compileProvider.aHrefSanitizationWhitelist(/^\s*(http|https|mailto|evernote):/);
]

# route settings
require './route'

# angular.js filters
require './filters/filter-by-property'
require './filters/order-object-by'

# angular.js services
require './services/note-filter'
require './services/progress'

# angular.js directives
require './directives/resize'

# angular.js controllers
require './controllers/controller'
require './controllers/navigation-controller'
require './controllers/menu-controller'
require './controllers/timeline-controller'
require './controllers/notes-controller'
require './controllers/settings-controller'
require './controllers/progress-modal-controller'
