import express from 'express';
import prisma from '../utils/prisma/index.js';
import { Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
// import authMiddlewares from '../middleswares/auth.middlewares.js';

const account_router = express.Router();

//회원가입 API
account_router.post('/sign-up', async (req, res, next) => {
  const { id, password, name, nickname } = req.body;
  const is_exist = await prisma.accounts.findFirst({
    where: {
      id,
    },
  });
  if (is_exist) {
    return res.status(409).json({ message: '이미 존재하는 아이디입니다.' });
  }

  //어카운트 테이블에 사용자 추가.
  const account = await prisma.accounts.create({
    data: { id, password, name, nickname },
  });

  //홀드 플레이어 테이블에 사용자 정보 추가.
  const hold_player = await prisma.hold_players.create({
    data: {
      account: {
        connect: { id: account.id },
      },
      player: {
        connect: { name: name },
      },
    },
  });

  return res.status(201).json({ message: '회원가입이 완료 되었습니다.' });
});

//로그인 API
account_router.post('/sign-in', async (req, res, next) => {});
//계정 조회 API
account_router.get('/accounts', async (req, res, next) => {});

export default account_router;
