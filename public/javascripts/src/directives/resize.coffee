app.directive 'resize', ($timeout, $rootScope, $window) ->
  link: ->
    timer = false
    angular.element($window).on 'load resize', (event) ->
      if timer then $timeout.cancel timer
      timer = $timeout ->
        $rootScope.$broadcast 'resize::resize'
      , 200
