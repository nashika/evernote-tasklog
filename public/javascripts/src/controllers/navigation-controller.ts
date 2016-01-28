class NavigationController {

    constructor(protected $scope:angular.IScope,
                protected $rootScope:angular.IRootScopeService,
                protected $route:angular.route.IRouteService) {
        this.$scope['navCollapse'] = true;
        this.$scope['$route'] = this.$route;
        this.$scope['reload'] = this._reload;
    }

    protected _reload = ():void => {
        this.$rootScope.$broadcast('event::reload');
    }

}

angular.module('App').controller('NavigationController', ['$scope', '$rootScope', '$route', NavigationController]);

export default NavigationController;
