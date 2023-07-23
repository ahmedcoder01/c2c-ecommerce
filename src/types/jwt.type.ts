import { JwtPayload } from "jsonwebtoken"

export interface UpdatedJwtPayload extends JwtPayload {
    email: string;
    userId: string | number;
  }