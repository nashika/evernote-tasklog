"use strict";
var ModalController = (function () {
    function ModalController($scope) {
        this.$scope = $scope;
    }
    return ModalController;
}());
exports.ModalController = ModalController;
angular.module('App').controller('ModalController', ['$scope', ModalController]);
//# sourceMappingURL=modal-controller.js.map