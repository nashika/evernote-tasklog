class Controller {

    constructor(protected $scope:angular.IScope) {
    }

}

angular.module('App').controller('Controller', ['$scope', Controller]);

export default Controller;
