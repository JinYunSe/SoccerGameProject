import express from 'express';
import joi from 'joi';
import {
  table_findFirst,
  row_create,
  row_update,
  table_findFirstInclude,
} from '../utils/tableFunction/table.js';
import { playerCountChange } from '../utils/soccer.player/enforce.js';
import { randomNumber01 } from '../utils/math/gambling.math.js';

import authMiddleware from '../middleswares/auth.middleware.js';

const name_validation = joi.object({
  name: joi
    .string()
    .pattern(/^[가-힣\s+$]/)
    .min(1)
    .max(191)
    .required(),
});

const enforce_validation = joi.object({
  rarity: joi.string().valid('SSR', 'SR', 'R').required(),
  add_run: joi.number().integer().min(0).max(2147483647).required(),
  add_goal_decision: joi.number().integer().min(0).max(2147483647).required(),
  add_power: joi.number().integer().min(0).max(2147483647).required(),
  add_defense: joi.number().integer().min(0).max(2147483647).required(),
  add_stamina: joi.number().integer().min(0).max(2147483647).required(),
  probability: joi.number().min(0).max(1).required(),
});

const update_enforce_validation = joi.object({
  rarity: joi.string().valid('SSR', 'SR', 'R').required(),
  enforce: joi.number().integer().min(1).max(7).required(),
  add_run: joi.number().integer().min(0).max(2147483647).optional(),
  add_goal_decision: joi.number().integer().min(0).max(2147483647).optional(),
  add_power: joi.number().integer().min(0).max(2147483647).optional(),
  add_defense: joi.number().integer().min(0).max(2147483647).optional(),
  add_stamina: joi.number().integer().min(0).max(2147483647).optional(),
  probability: joi.number().min(0).max(1).optional(),
});

const enforce_router = express.Router();

enforce_router.patch('/enforce', authMiddleware, async (req, res, next) => {
  try {
    const validation = await name_validation.validateAsync(req.body);
    const exist_hold_player = await table_findFirstInclude(
      process.env.HOLD_PLAYERS,
      {
        account_id: req.user.account_id,
        ...validation,
      },
      { player: { select: { rarity: true } } },
    );

    console.log(exist_hold_player);

    if (!exist_hold_player) return res.status(404).json('강화할 선수가 없습니다.');

    if (exist_hold_player.enforce >= 7)
      return res.status(200).json('모든 강화가 완료된 선수 입니다.');
    else if (exist_hold_player.enforce >= exist_hold_player.count)
      return res.status(402).json('강화 재료가 부족합니다.');
    exist_hold_player.count -= exist_hold_player.enforce;

    const rarity_row_enforce = await table_findFirst(exist_hold_player.player.rarity, {
      enforce: exist_hold_player.enforce,
    });

    if (randomNumber01() > rarity_row_enforce.probability) {
      await playerCountChange(exist_hold_player);
      return res.status(400).json('강화에 실패했습니다.');
    }

    exist_hold_player.enforce += 1;
    await playerCountChange(exist_hold_player);
    return res.status(201).json(`${exist_hold_player.enforce}강화에 성공했습니다.`);
  } catch (error) {
    next(error);
  }
});

enforce_router.post('/rarity', async (req, res, next) => {
  try {
    const validation = await enforce_validation.validateAsync(req.body);
    const rarity = validation.rarity;

    delete validation.rarity;

    const result = await row_create(rarity, { ...validation });
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

enforce_router.patch('/rarity', async (req, res, next) => {
  try {
    const validation = await update_enforce_validation.validateAsync(req.body);
    const rarity = validation.rarity;
    const enforce = validation.enforce;

    delete validation.rarity;
    delete validation.enforce;

    const result = await row_update(rarity, { enforce }, { ...validation });
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

export default enforce_router;
