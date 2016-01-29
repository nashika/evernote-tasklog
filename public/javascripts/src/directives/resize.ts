angular.module('App').directive('resize', ($timeout, $rootScope, $window) => {
    return {
        link: () => {
            var timer = false;
            angular.element($window).on('load resize', (event) => {
                if (timer) $timeout.cancel(timer);
                timer = $timeout(() => {
                    $rootScope.$broadcast('resize::resize');
                }, 200);
            });
        }
    }
});
