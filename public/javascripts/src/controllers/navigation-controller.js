var NavigationController = (function () {
    function NavigationController($scope, $rootScope, $route) {
        var _this = this;
        this.$scope = $scope;
        this.$rootScope = $rootScope;
        this.$route = $route;
        this._reload = function () {
            _this.$rootScope.$broadcast('event::reload');
        };
        this.$scope.navCollapse = true;
        this.$scope.$route = this.$route;
        this.$scope.reload = this._reload;
    }
    return NavigationController;
})();
angular.module('App').controller('NavigationController', ['$scope', '$rootScope', '$route', NavigationController]);
//# sourceMappingURL=navigation-controller.js.map