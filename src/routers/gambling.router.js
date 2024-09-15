import express from 'express';
import prisma from '../utils/prisma/index.js';
import checkBatchimEnding from '../utils/lastkorean/consonants.js';
import joi from 'joi';

const gambling_router = express.Router();

const nameValidation = joi.object({
  name: joi
    .string()
    .pattern(/^[가-힣A-Z]+$/)
    .min(1)
    .max(191)
    .required(),
});

const InputValidation = joi.object({
  name: joi
    .string()
    .pattern(/^[가-힣A-Z]+$/)
    .min(1)
    .max(191)
    .required(),
  rarity: joi.number().integer().min(0).max(2).required(),
  stats_run: joi.number().min(0).max(2147483647).required(),
  stats_goal_decision: joi.number().min(0).max(2147483647).required(),
  stats_power: joi.number().integer().min(0).max(2147483647).required(),
  stats_defense: joi.number().integer().min(0).max(2147483647).required(),
  stats_stamina: joi.number().integer().min(0).max(2147483647).required(),
});

gambling_router.post('/gambling', async (req, res, next) => {
  try {
    const validation = await InputValidation.validateAsync(req.body);

    const is_exit = await prisma.players.findFirst({
      where: {
        name: validation.name,
      },
    });
    if (is_exit) return res.stats(401).json('이미 존재하는 선수 입니다.');

    await prisma.players.create({
      data: {
        ...validation,
      },
    });

    const add_last_korean = checkBatchimEnding(validation.name) ? '이' : '가';
    return res.status(201).json(`뽑기에 ${validation.name}${add_last_korean} 추가 됐습니다.`);
  } catch (error) {
    next(error);
  }
});

/*gambling_router.patch('/gambling', async (req, res, next) => {
  try {
    const name = await nameValidation.validateAsync(req.body);
  } catch (error) {
    next(error);
  }
});*/

gambling_router.delete('/gambling', async (req, res, next) => {
  try {
    const { name } = await nameValidation.validateAsync(req.body);
    const is_exit = await prisma.players.findFirst({
      where: { name },
    });
    if (!is_exit) res.status(404).json('해당 선수가 존재하지 않습니다.');

    await prisma.players.delete({
      where: { name },
    });

    const add_last_korean = checkBatchimEnding(validation.name) ? '이' : '가';
    return res.status(201).json(`선수 ${is_exit.name}${add_last_korean} 삭제 됐습니다.`);
  } catch (error) {
    next(error);
  }
});

export default gambling_router;
