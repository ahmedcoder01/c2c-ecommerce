import bcrypt  from 'bcrypt';
import jwt from 'jsonwebtoken';
import httpStatus from 'http-status';
import prisma from "../../prisma/prisma-client";
import HttpException from "../utils/http-exception";
import config from '../config';
import logger from '../logger';
import { UpdatedJwtPayload } from '../types/jwt.type';


export  const createUser = async ({email, password, name}: {
    email: string;
    password: string;
    name: string;
    
}) => {
    // TODO: use individual salt for each user and store it in the database
    const passSalt = config.variables.passwordSalt;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
     const user =   prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            name,
            sellerProfile: {
              create: {}
            },
            cart: {
              create: {}
            }
        },

        select: {
          email: true,
          id: true,
          name: true,
          sellerProfile: true
        }
    });

    return user

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

       
        select: {
          name: true,
          id:  true,
          email: true,
          sellerProfile: true,
          password: true
        }
        
    });
    if (!user) {
        throw new HttpException(401, 'Invalid credentials');
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        throw new HttpException(401, 'Invalid credentials');
    }
    return {
      name: user.name,
      email: user.email,
      id: user.id,
      sellerProfile: user.sellerProfile
    };
}

export const getUserInfo = async (email: string) => {
  const user = await prisma.user.findUnique({
    where: {
      email
    },
    select: {
      email: true,
      id: true,
      name: true,
      sellerProfile: true
    }
  });
  if (!user) {
    throw new HttpException(
      httpStatus.NOT_FOUND
      , 'User not found');
  }

  return user;
}

export const signAccessToken = (payload: UpdatedJwtPayload, expiresIn: string) =>
  jwt.sign(payload, config.variables.jwtAccessSecret, {
    expiresIn,
  });

export const signRefreshToken = (payload: UpdatedJwtPayload, expiresIn: string) =>
  jwt.sign(payload, config.variables.jwtRefreshSecret, {
  expiresIn,
  });

export const verifyAccessToken = (token: string): UpdatedJwtPayload =>
  jwt.verify(token, config.variables.jwtAccessSecret) as UpdatedJwtPayload;
export const verifyRefreshToken = (token: string): UpdatedJwtPayload =>
  jwt.verify(token, config.variables.jwtRefreshSecret) as UpdatedJwtPayload;
