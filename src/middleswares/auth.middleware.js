import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma/index.js';

export default async function (req, res, next) {
  try {
    const authorization = req.headers.authorization;

    if (!authorization) throw new Error('토큰이 존재하지 않습니다.');

    const [token_type, token] = authorization.split(' ');

    if (!token || token_type !== process.env.TOKEN_TYPE)
      throw new Error('토큰 형식이 올바르지 않습니다.');

    const decoded_token = jwt.verify(token, process.env.JWT_SECRET);

    const account_id = decoded_token.account_id;

    const user = await prisma.accounts.findFirst({
      where: { account_id },
    });

    if (!user) {
      throw new Error('토큰 사용자가 존재하지 않습니다.');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}
