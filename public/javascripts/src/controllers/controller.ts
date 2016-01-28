class Controller {

    constructor(protected $scope) {
    }

}

angular.module('App').controller('Controller', ['$scope', Controller]);

export default Controller;
