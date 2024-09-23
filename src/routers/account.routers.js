import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import joi from 'joi';
import authMiddleware from '../middleswares/auth.middleware.js';
import { row_create, table_findFirst, row_update } from '../utils/tableFunction/table.js';

const router = express.Router();

const account_vaildation = joi.object({
  id: joi
    .string()
    .pattern(/^[a-zA-Z0-9]+$/)
    .min(1)
    .max(191)
    .required(),
  password: joi
    .string()
    .pattern(/^[a-zA-Z0-9]+$/)
    .min(1)
    .max(191)
    .required(),
  confirmed_password: joi
    .string()
    .pattern(/^[a-zA-Z0-9]+$/)
    .min(1)
    .max(191)
    .required(),
  name: joi
    .string()
    .pattern(/^[가-힣]+$/)
    .min(1)
    .max(191)
    .required(),
  nickname: joi.string().min(1).max(191).required(),
});

const id_password_validate = joi.object({
  id: joi
    .string()
    .min(1)
    .max(191)
    .pattern(/^[a-zA-Z0-9]+$/)
    .required(),
  password: joi
    .string()
    .min(1)
    .max(191)
    .pattern(/^[a-zA-Z0-9]+$/)
    .required(),
});

const money_validate = joi.object({
  money: joi.number().integer().min(1000).multiple(1000).required(),
});

// 회원가입 API
router.post('/sign-up', async (req, res, next) => {
  try {
    const vaildation = await account_vaildation.validateAsync(req.body);
    const { name, id, password, confirmed_password, nickname } = vaildation;

    if (password !== confirmed_password)
      return res.status(400).json('비밀번호가 일치하지 않습니다.');

    const is_exist_user = await table_findFirst(process.env.ACCOUNTS, {
      OR: [{ id: id }, { nickname: nickname }],
    });

    if (is_exist_user) {
      if (is_exist_user.id === id) {
        return res.status(409).json('존재하는 아이디입니다.');
      }
      if (is_exist_user.nickname === nickname) {
        return res.status(409).json('존재하는 닉네임입니다.');
      }
    }

    const hashed_password = await bcrypt.hash(password, 10);

    await row_create(process.env.ACCOUNTS, {
      id,
      password: hashed_password,
      name,
      nickname,
    });

    return res.status(201).json('회원가입에 성공했습니다.');
  } catch (error) {
    next(error);
  }
});

// 로그인 API
router.post('/sign-in', async (req, res, next) => {
  try {
    const { id, password } = await id_password_validate.validateAsync(req.body);

    const user = await table_findFirst(process.env.ACCOUNTS, { id });

    if (!user) return res.status(401).json('아이디가 존재하지 않습니다.');
    else if (!(await bcrypt.compare(password, user.password)))
      return res.status(401).json('비밀번호가 일치하지 않습니다.');

    const token = jwt.sign({ account_id: user.account_id }, process.env.JWT_SECRET);

    res.header(`${process.env.TOKEN_KEY}`, `${process.env.TOKEN_TYPE} ${token}`);
    return res.status(200).json('로그인 성공');
  } catch (error) {
    next(error);
  }
});

router.patch('/addcash', authMiddleware, async (req, res, next) => {
  const { money } = await money_validate.validateAsync(req.body);
  let { account_id, nickname, cash, total_cash } = req.user;

  cash += money;
  total_cash += money;
  await row_update(process.env.ACCOUNTS, { account_id }, { cash, total_cash });

  return res
    .status(200)
    .json(`10000원이 충전 됐습니다! ${nickname}은 여태까지 ${total_cash}원 충전하셨습니다`);
});

export default router;
