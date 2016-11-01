import express = require("express");
import {Router, Request, Response} from "express";
import evernote = require("evernote");
import {injectable} from "inversify";

import {TableService} from "../service/table-service";
import {EvernoteClientService} from "../service/evernote-client-service";
import {GlobalUserEntity} from "../../common/entity/global-user-entity";
import {BaseMultiRoute} from "./base-multi-route";
import {GlobalUserTable} from "../table/global-user-table";
import {Code403Error} from "./base-route";
import {SessionService} from "../service/session-service";

@injectable()
export class GlobalUserRoute extends BaseMultiRoute<GlobalUserEntity, GlobalUserTable> {

  constructor(protected tableService: TableService,
              protected evernoteClientService: EvernoteClientService,
              protected sessionService: SessionService) {
    super(tableService, sessionService);
  }

  getRouter(): Router {
    let _router = super.getRouter();
    _router.post("/load", (req, res) => this.wrap(req, res, this.load));
    _router.post("/change", (req, res) => this.wrap(req, res, this.change));
    _router.post("/auth", (req, res) => this.wrap(req, res, this.auth));
    _router.post("/logout", (req, res) => this.wrap(req, res, this.logout));
    return _router;
  }

  load(req: Request, res: Response): Promise<GlobalUserEntity> {
    let result: GlobalUserEntity;
    let session = this.sessionService.get(req);
    return Promise.resolve(session.globalUser);
  }

  change(req: Request, res: Response): Promise<void> {
    let globalUser: GlobalUserEntity = new GlobalUserEntity(req.body);
    let session = this.sessionService.get(req);
    session.globalUser = globalUser;
    return this.sessionService.save(req);
  }

  auth(req: Request, res: Response): Promise<GlobalUserEntity> {
    let result: GlobalUserEntity;
    let session = this.sessionService.get(req);
    return Promise.resolve().then(() => {
      let sandbox: boolean = req.body.sandbox ? true : false;
      let token: string = req.body.token;
      return this.checkToken(sandbox, token);
    }).then(globalUserEntity => {
      let result = globalUserEntity;
      return this.getTable(req).save(globalUserEntity);
    }).then(() => {
      session.globalUser = result;
      return this.sessionService.save(req);
    }).then(() => {
      return result;
    });
  }

  logout(req: Request, res: Response): Promise<void> {
    this.sessionService.set(req, null);
    return this.sessionService.save(req);
  }

  private checkToken(sandbox: boolean, token: string): Promise<GlobalUserEntity> {
    return this.evernoteClientService.getUserFromToken(token, sandbox).then(user => {
      let result = new GlobalUserEntity();
      result._id = sandbox ? `sandbox-${user.username}` : user.username;
      result.sandbox = sandbox;
      result.username = user.username;
      result.token = token;
      return result;
    }).catch(err => Promise.reject(new Code403Error(err)));
  }

}
