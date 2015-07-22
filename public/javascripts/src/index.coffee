core = require './core'

# angular.js setting
app = angular.module('App', ['ui.bootstrap'])
core.angular = angular
core.app = app

# visjs setting
core.vis = vis

# angular.js filters
require './filters/order-object-by'

# angular.js controllers
require './controllers/controller'
