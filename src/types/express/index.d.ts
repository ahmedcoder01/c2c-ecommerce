// to make the file a module and avoid the TypeScript error
export {};

declare global {
  namespace Express {
    export interface Request {
      userId: number;
      email: string;
      sellerId: number;
    }

    // export interface Response {
    //   locals: {
    //     userId?: string;
    //     email?: string;
    //   };
    // }
  }
}
