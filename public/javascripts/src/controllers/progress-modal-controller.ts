import ModalController from './modal-controller';
import ProgressService from "../services/progress";

interface IProgressModalControllerScope extends angular.IScope {
    progress:ProgressService;
}

class ProgressModalController extends ModalController {

    constructor(protected $scope:IProgressModalControllerScope,
                protected progress:ProgressService) {
        super($scope);
        this.$scope.progress = this.progress;
    }

}

angular.module('App').controller('ProgressModalController', ['$scope', 'progress', ProgressModalController]);

export default ProgressModalController;
