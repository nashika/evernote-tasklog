import core from '../core';
import ModalController from './modal-controller';
import ProgressService from "../services/progress";

class ProgressModalController extends ModalController {

    constructor(protected $scope:angular.IScope,
                protected progress:ProgressService) {
        super($scope);
        this.$scope['progress'] = this.progress;
    }

}

core.app.controller('ProgressModalController', ['$scope', 'progress', ProgressModalController]);

export default ProgressModalController;
