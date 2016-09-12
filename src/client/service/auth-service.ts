import request = require("superagent");

import {BaseService} from "./base-service";

export interface IAuthResult {
  token: string;
  username: string;
}

export class AuthService extends BaseService {

  public sandbox: IAuthResult;
  public production: IAuthResult;

  constructor() {
    super();
    this.sandbox = {token: null, username: null};
    this.production = {token: null, username: null};
  }

  public check(): Promise<boolean> {
    return request.post("/auth").then(req => {
      let data: boolean = req.body;
      return data;
    });
  }

  public initialize(): Promise<void> {
    return Promise.resolve().then(() => {
      return request.post("/auth/token").then(req => {
        this.production = req.body;
      });
    }).then(() => {
      return request.post("/auth/token").send({sandbox: true}).then(req => {
        this.sandbox = req.body;
      });
    });
  }

  public login(sandbox: boolean, useToken: boolean): Promise<void> {
    return request.post("/auth/login").send({sandbox: sandbox, token: useToken}).then(req => {
      return;
    });
  }

  public logout(): Promise<void> {
    return request.post("/auth/logout").then(req => {
      return;
    });
  }

  public setToken(sandbox: boolean, token: string): Promise<void> {
    return request.post("/auth/token").send({sandbox: sandbox, token: token}).then(req => {
      let data: IAuthResult = req.body;
      if (sandbox)
        this.sandbox = data;
      else
        this.production = data;
      if (!data) alert('Token is invalid.');
    });
  }

}
