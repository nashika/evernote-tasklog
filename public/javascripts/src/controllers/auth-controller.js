var AuthController = (function () {
    function AuthController($scope, $http) {
        var _this = this;
        this.$scope = $scope;
        this.$http = $http;
        this._init = function () {
            _this.$http.get('/auth/token')
                .error(function (data) {
                throw new Error(data);
            })
                .success(function (data) {
                _this.$scope.production = data;
                _this.$http.post('/auth/token', { sandbox: true })
                    .error(function (data) {
                    throw new Error(data);
                })
                    .success(function (data) {
                    _this.$scope.sandbox = data;
                });
            });
        };
        this._setToken = function (sandbox) {
            var token = prompt("Input developer token (" + (sandbox ? 'sandbox' : 'production') + ")");
            if (!token)
                return;
            _this.$http.post('/auth/token', { sandbox: sandbox, token: token })
                .success(function (data) {
                if (sandbox)
                    _this.$scope.sandbox = data;
                else
                    _this.$scope.production = data;
                if (!data)
                    alert('Token is invalid.');
            })
                .error(function (data) {
                alert('Set token failed.');
            });
        };
        this.$scope.message = null;
        this.$scope.isDeveloper = false;
        this.$scope.sandbox = { token: null, username: null };
        this.$scope.production = { token: null, username: null };
        this.$scope.setToken = this._setToken;
        this._init();
    }
    return AuthController;
}());
angular.module('App').controller('AuthController', ['$scope', '$http', AuthController]);
//# sourceMappingURL=auth-controller.js.map