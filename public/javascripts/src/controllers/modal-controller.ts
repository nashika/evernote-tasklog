class ModalController {

  constructor(protected $scope:angular.IScope) {
  }

}

angular.module('App').controller('ModalController', ['$scope', ModalController]);

export default ModalController;
