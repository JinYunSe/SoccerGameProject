import express from 'express';
import joi from 'joi';
import { table_findFirst, row_create, row_update } from '../utils/tableFunction/table.js';

import authMiddleware from '../middleswares/auth.middleware.js';

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

enforce_router.patch('/enforce', authMiddleware, async (req, res, next) => {
  try {
    const validation = await name_validation.validateAsync(req.body);
    const exist_hold_player = await table_findFirst(process.env.HOLD_PLAYERS, {
      account_id: req.user.account_id,
      ...validation,
    });

    if (!exist_hold_player) return res.status(404).json('강화할 선수가 없습니다.');

    if (exist_hold_player.enforce >= 7)
      return res.status(200).json('모든 강화가 완료된 선수 입니다.');
    else if (exist_hold_player.enforce >= exist_hold_player.count)
      return res.status(402).json('강화 재화가 부족합니다.');
    exist_hold_player.count -= exist_hold_player.enforce;
    exist_hold_player.enforce += 1;
    const result = await row_update(
      process.env.HOLD_PLAYERS,
      { id: exist_hold_player.id },
      { enforce: exist_hold_player.enforce, count: exist_hold_player.count },
    );

    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

enforce_router.post('/rarity', async (req, res, next) => {
  try {
    const validation = await stats_validation.validateAsync(req.body);
    const rarity = validation.rarity;
    delete validation.rarity;
    await row_create(rarity, { ...validation });
    return res.status(200).json(`${rarity} 등급 STATS 증가가 등록 됐습니다`);
  } catch (error) {
    next(error);
  }
});

export default enforce_router;
