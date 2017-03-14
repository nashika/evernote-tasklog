import _ = require("lodash");
import log4js = require("log4js");
import {Request, Response, Router} from "express";
import {injectable} from "inversify";

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

@injectable()
export abstract class BaseRoute {

  abstract getBasePath(): string;

  abstract getRouter(): Router;

  protected async wrap(req: Request, res: Response, func: (req: Request, res: Response) => Promise<any>): Promise<void> {
    try {
      let data = await func.call(this, req, res);
      res.json(data);
    } catch (err) {
      this.responseErrorJson(res, err);
    }
  }

  private responseErrorJson(res: Response, err: any) {
    let parse = this.parseError(err);
    let result = {
      result: false,
      message: parse.message,
      code: parse.code,
      error: err,
      stack: parse.stack && _.split(parse.stack, "\n"),
    };
    logger.error(`Error ${result.code}. ${result.message}`);
    if (parse.stack) logger.debug(parse.stack);
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

}
