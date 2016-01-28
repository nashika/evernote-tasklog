var Controller = (function () {
    function Controller($scope) {
        this.$scope = $scope;
    }
    return Controller;
})();
angular.module('App').controller('Controller', ['$scope', Controller]);
exports.__esModule = true;
exports["default"] = Controller;
//# sourceMappingURL=controller.js.map