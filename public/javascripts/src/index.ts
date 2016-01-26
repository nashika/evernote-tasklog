import core from './core';

// angular.js setting
(<any>window).app = angular.module('App', ['ngRoute', 'ui.bootstrap', 'ngSanitize', 'ui.select']);

core.app.config(['$compileProvider', ($compileProvider) => {
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(http|https|mailto|evernote):/);
}]);

// route settings
import './route';

// angular.js filters
import './filters/abbreviate';
import './filters/filter-by-property';
import './filters/object-length';
import './filters/order-object-by';
import './filters/spent-time';

// angular.js services
import './services/data-store';
import './services/data-transciever';
import './services/progress';

// angular.js directives
import './directives/resize';

// angular.js controllers
import './controllers/auth-controller';
import './controllers/controller';
import './controllers/menu-controller';
import './controllers/navigation-controller';
import './controllers/notes-controller';
import './controllers/progress-modal-controller';
import './controllers/settings-controller';
import './controllers/timeline-controller';
