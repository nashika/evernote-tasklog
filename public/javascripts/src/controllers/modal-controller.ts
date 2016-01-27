import core from '../core';

class ModalController {

  constructor(protected $scope:angular.IScope) {
  }

}

core.app.controller('ModalController', ['$scope', ModalController]);

export default ModalController;
