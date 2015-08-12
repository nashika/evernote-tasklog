class Controller

  constructor: (@$scope, @dataTransciever) ->
    @$scope.dataTransciever = @dataTransciever
    @dataTransciever.reload()

app.controller 'Controller', ['$scope', 'dataTransciever', Controller]
module.exports = Controller
