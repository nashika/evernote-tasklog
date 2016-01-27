import core from '../core';

class Controller {

    constructor(protected $scope) {
    }

}

core.app.controller('Controller', ['$scope', Controller]);

export default Controller;
