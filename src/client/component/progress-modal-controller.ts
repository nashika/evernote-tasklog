import {ProgressService} from "../services/progress";
import {ModalController} from "./modal-controller";

interface IProgressModalControllerScope extends angular.IScope {
    progress:ProgressService;
}

export class ProgressModalController extends ModalController {

    constructor(protected $scope:IProgressModalControllerScope,
                protected progress:ProgressService) {
        super($scope);
        this.$scope.progress = this.progress;
    }

}

angular.module('App').controller('ProgressModalController', ['$scope', 'progress', ProgressModalController]);
