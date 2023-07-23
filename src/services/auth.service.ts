import bcrypt  from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from "../../prisma/prisma-client";
import HttpException from "../models/http-exception.model";
import config from '../config';


export  const createUser = async ({email, password, name}: {
    email: string;
    password: string;
    name: string;
    
}) => {
    // TODO: use individual salt for each user and store it in the database
    const passSalt = config.variables.passwordSalt;
    const hashedPassword = await bcrypt.hash(password, passSalt);
    
     return  prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            name,
        },
    });

    

}

export const checkEmailUniqueness = async (email: string) => {
    const user = await prisma.user.findUnique({
        where: {
            email,
        },
    });
    if (user) {
      throw new HttpException(409, 'Email already exists');
    }
};

export const login = async ({email, password}: { email: string; password: string; }) => {
    const user = await prisma.user.findUnique({
        where: {
            email,
        },
    });
    if (!user) {
        throw new HttpException(401, 'Invalid credentials');
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        throw new HttpException(401, 'Invalid credentials');
    }
    return user;
}

export const signAccessToken = (payload: any, expiresIn: string) =>
  jwt.sign(payload, config.variables.jwtAccessSecret, {
    expiresIn,
  });

export const signRefreshToken = (payload: any, expiresIn: string) =>
  jwt.sign(payload, config.variables.jwtRefreshSecret, {
    expiresIn,
  });

export const verifyAccessToken = (token: string) =>
  jwt.verify(token, config.variables.jwtAccessSecret);
export const verifyRefreshToken = (token: string) =>
  jwt.verify(token, config.variables.jwtRefreshSecret);
