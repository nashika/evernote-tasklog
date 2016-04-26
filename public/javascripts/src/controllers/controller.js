var Controller = (function () {
    function Controller($scope) {
        this.$scope = $scope;
    }
    return Controller;
}());
angular.module('App').controller('Controller', ['$scope', Controller]);
//# sourceMappingURL=controller.js.map