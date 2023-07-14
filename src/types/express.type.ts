import { RequestHandler } from 'express';

type WithError<T> = T & { code?: number; message?: string; stack?: string };

export type ExpressHandlerOptional<Req, Res> = RequestHandler<
  Record<string, string | undefined>,
  Partial<WithError<Res>>,
  Partial<Req>
>;
export type ExpressHandler<Req, Res> = RequestHandler<
  Record<string, string>,
  Partial<WithError<Res>>,
  Req
>;

export type ExpressHandlerWithParams<Params, Req, Res> = RequestHandler<
  Partial<Params>,
  WithError<Res>,
  Partial<Req>,
  any
>;
