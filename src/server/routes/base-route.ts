import _ = require("lodash");
import log4js = require("log4js");
import {Express, Response, Router} from "express";

let logger = log4js.getLogger("system");

export class CodeError extends Error {
  code: number;
}

export class Code403Error extends CodeError {
  code: number = 403;
  message: string = "Access Forbidden";
}

export class Code404Error extends CodeError {
  code: number = 404;
  message: string = "Not Found";
}

export class Code500Error extends CodeError {
  code: number = 500;
  message: string = "Internal Server Error";
}

export abstract class BaseRoute {

  protected app: Express;

  constructor(app: Express) {
    this.app = app;
  }

  get Class(): typeof BaseRoute {
    return <typeof BaseRoute>this.constructor;
  }

  abstract getRouter(): Router;

  protected responseErrorJson(res: Response, err: any) {
    let parse = this.parseError(err);
    let result = {
      result: false,
      message: parse.message,
      code: parse.code,
      error: err,
      stack: parse.stack && _.split(parse.stack, "\n"),
    };
    res.status(parse.code).json(result);
  }

  private parseError(err: any): {code: number, message: string, stack: string} {
    let code: number, message: string, stack: string;
    if (err instanceof CodeError) {
      let codeError = <CodeError>err;
      code = codeError.code;
      message = codeError.message;
      stack = codeError.stack;
    } else {
      code = 500;
      message = err.toString();
      stack = err && err.stack;
    }
    if (code == 500)
      logger.error(message);
    return {code: code, message: message, stack: stack};
  }

  protected mergeParams(req: {body: any, query: any}): Object {
    var body = req['body'] || {};
    var query = req['query'] || {};
    return _.merge({}, body, query);
  }

}
