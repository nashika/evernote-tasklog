interface IAuthControllerScope extends angular.IScope {
    message:string;
    isDeveloper:boolean;
    sandbox:{token:string, username:string};
    production:{token:string, username:string};
    setToken:Function;
}

class AuthController {

    constructor(protected $scope:IAuthControllerScope, protected $http:angular.IHttpService) {
        this.$scope.message = null;
        this.$scope.isDeveloper = false;
        this.$scope.sandbox = {token: null, username: null};
        this.$scope.production = {token: null, username: null};
        this.$scope.setToken = this._setToken;
        this._init();
    }

    _init = ():void => {
        this.$http.get('/auth/token')
            .error((data) => {
                throw new Error(data);
            })
            .success((data:{token:string, username:string}) => {
                this.$scope.production = data;
                this.$http.post('/auth/token', {sandbox: true})
                    .error((data) => {
                        throw new Error(data);
                    })
                    .success((data:{token:string, username:string}) => {
                        this.$scope.sandbox = data;
                    });
            });
    };

    _setToken = (sandbox:boolean):void => {
        var token = prompt(`Input developer token (${sandbox ? 'sandbox' : 'production'})`);
        if (!token) return;
        this.$http.post('/auth/token', {sandbox: sandbox, token: token})
            .success((data:{token:string, username:string}) => {
                if (sandbox)
                    this.$scope.sandbox = data;
                else
                    this.$scope.production = data;
                if (!data) alert('Token is invalid.');
            })
            .error((data) => {
                alert('Set token failed.');
            });
    };

}

angular.module('App').controller('AuthController', ['$scope', '$http', AuthController]);

export default AuthController;
