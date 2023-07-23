declare namespace Express {
  export interface Request {
    locals: {
      userId?: string;
      email?: string;
    };
  }
}






