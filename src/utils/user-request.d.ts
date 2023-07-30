declare namespace Express {
  export interface Response {
    locals: {
      userId?: string;
      email?: string;
    };
  }
}
