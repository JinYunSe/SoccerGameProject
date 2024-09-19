import express from 'express';
import joi from 'joi';
import { tableFindFirst, rarityRowCreate } from '../utils/math/enforce.js';

import prisma from '../utils/prisma/index.js';

import { existingHoldPlayer } from '../utils/players/holdplayers.js';

const name_validation = joi.object({
  name: joi
    .string()
    .pattern(/^[가-힣\s+$]/)
    .min(1)
    .max(191)
    .required(),
});

const stats_validation = joi.object({
  rarity: joi.string().valid('SSR', 'SR', 'R').required(),
  add_run: joi.number().integer().min(1).max(2147483647).required(),
  add_goal_decision: joi.number().integer().min(1).max(2147483647).required(),
  add_power: joi.number().integer().min(1).max(2147483647).required(),
  add_defense: joi.number().integer().min(1).max(2147483647).required(),
  add_stamina: joi.number().integer().min(1).max(2147483647).required(),
});

const enforce_router = express.Router();

enforce_router.patch('/enforce', async (req, res, next) => {
  const { name } = await name_validation.validateAsync(req.body);
  const exist_hold_player = await existingHoldPlayer(1, name);
  console.log(
    '선수 이름' +
      exist_hold_player.name +
      ', 강화 등급 : ' +
      exist_hold_player.enforce +
      ', 개수 : ' +
      exist_hold_player.count,
  );
  console.log(exist_hold_player);
  if (!exist_hold_player) return res.status(404).json('강화할 선수가 없습니다.');

  if (exist_hold_player.enforce > exist_hold_player.count)
    return res.status(402).json('강화 재화가 부족합니다.');

  const result = await tableFindFirst(exist_hold_player.id, exist_hold_player.enforce);

  return res.status(201).json(result);
});

enforce_router.post('/rarity', async (req, res, next) => {
  try {
    const validation = await stats_validation.validateAsync(req.body);

    const rarity = validation.rarity;
    // rarity는 테이블 이름을 위해 사용될거라 따로 변수로 받고

    delete validation.rarity;
    // 검증에서 rarity 삭제

    await rarityRowCreate(rarity, { ...validation });
    return res.status(200).json(`${rarity} 등급의 강화 항목이 추가 됐습니다.`);
  } catch (error) {
    next(error);
  }
});

export default enforce_router;
