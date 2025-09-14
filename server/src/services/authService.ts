import createHttpError from "http-errors";
import validator from "validator";
import prisma from "../configs/db.js";
import bcrypt from "bcryptjs";
import { encryptPassword } from "../utils/passwordUtil.js";

interface CreateUser {
  name: string;
  email: string;
  password: string;
}

export interface User {
  id: number;
  name: string | null;
  email: string;
  password: string;
  picture: string | null;
  token: string | null;
  lastLogin: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface loginUser {
  email: string;
  password: string;
}

export const createUser = async ({
  name,
  email,
  password,
}: CreateUser): Promise<User> => {
  if (!name || !email || !password) {
    throw createHttpError.BadRequest("Please fill all fields");
  }

  if (
    !validator.isLength(name, {
      min: 2,
      max: 25,
    })
  ) {
    throw createHttpError.BadRequest(
      "Please make sure your name is between 2 and 25 characters"
    );
  }

  if (!validator.isEmail(email)) {
    throw createHttpError.BadRequest("Please enter a valid email address");
  }

  if (
    !validator.isLength(password, {
      min: 6,
      max: 128,
    })
  ) {
    throw createHttpError.BadRequest(
      "Please make sure your password is between 6 and 128 characters."
    );
  }

  const checkUser = await prisma.user.findUnique({
    where: {
      email: email,
    },
  });

  if (checkUser) {
    throw createHttpError.BadRequest("This user already exists, please login");
  }

  const encryptedPassword = await encryptPassword(password);

  const user = await prisma.user.create({
    data: {
      name: name,
      email: email,
      password: encryptedPassword,
    },
  });

  return user;
};

export const verifyUser = async ({
  email,
  password,
}: loginUser): Promise<User> => {
  const checkUser = await prisma.user.findUnique({
    where: {
      email: email,
    },
  });

  if (!checkUser) {
    throw createHttpError.BadRequest("InvalidCredentials");
  }

  const passwordMatches = await bcrypt.compare(password, checkUser.password);

  if (!passwordMatches) {
    throw createHttpError.Unauthorized("Invalid password");
  }

  

  checkUser.lastLogin = new Date();

  return checkUser;
};
