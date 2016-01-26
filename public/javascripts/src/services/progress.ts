import core from '../core';

class ProgressService {

    modalInstance = null;
    value:number = 0;
    completeCount:number = 0;
    allCount:number = 0;
    message:string = '';

    constructor(public $modal) {
    }

    open(allCount:number):void {
        this.message = 'processing...';
        this.value = 0;
        this.completeCount = 0;
        this.allCount = allCount;
        this.modalInstance = this.$modal.open({
            templateUrl: 'progress-modal',
            controller: 'ProgressModalController',
            backdrop: 'static',
            keyboard: false,
            size: 'sm',
            animation: false,
        });
    }

    close():void {
        this.modalInstance.close();
    }

    set(message:string, value:number = null) {
        this.message = message;
        if (value !== null)
            this.value = value;
    }

    next(message:string) {
        this.completeCount++
        this.set(message, this.completeCount / this.allCount * 100);
    }

}

core.app.service('progress', ['$modal', ProgressService]);

export default ProgressService;
