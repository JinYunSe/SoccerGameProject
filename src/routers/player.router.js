import express from 'express';
import prisma from '../utils/prisma/index.js';
import { probabilityAdjustment } from '../utils/players/players.js';

import { row_delete, row_update, table_findFirst } from '../utils/tableFunction/table.js';

import checkBatchimEnding from '../utils/lastkorean/consonants.js';
import joi from 'joi';

const player_router = express.Router();

const name_validation = joi.object({
  name: joi
    .string()
    .pattern(/^[가-힣A-Z\s]+$/)
    .min(1)
    .max(191)
    .required(),
});

const create_validation = joi.object({
  name: joi
    .string()
    .pattern(/^[가-힣A-Z\s]+$/)
    .min(1)
    .max(191)
    .required(),
  rarity: joi.string().valid('SSR', 'SR', 'R').required(),
  stats_run: joi.number().min(0).max(2147483647).required(),
  stats_goal_decision: joi.number().min(0).max(2147483647).required(),
  stats_power: joi.number().integer().min(0).max(2147483647).required(),
  stats_defense: joi.number().integer().min(0).max(2147483647).required(),
  stats_stamina: joi.number().integer().min(0).max(2147483647).required(),
});

const updated_validation = joi.object({
  name: joi
    .string()
    .pattern(/^[가-힣A-Z\s]+$/)
    .min(1)
    .max(191)
    .required(),
  rarity: joi.string().valid('SSR', 'SR', 'R').required(),
  stats_run: joi.number().min(0).max(2147483647).optional(),
  stats_goal_decision: joi.number().min(0).max(2147483647).optional(),
  stats_power: joi.number().integer().min(0).max(2147483647).optional(),
  stats_defense: joi.number().integer().min(0).max(2147483647).optional(),
  stats_stamina: joi.number().integer().min(0).max(2147483647).optional(),
});

// 선수 추가 API
player_router.post('/player', async (req, res, next) => {
  try {
    const validation = await create_validation.validateAsync(req.body);

    if (await table_findFirst(process.env.PLAYERS, { name: validation.name }))
      return res.status(401).json('이미 존재하는 선수 입니다.');

    await prisma.players.create({
      data: {
        ...validation,
      },
    });

    await probabilityAdjustment(validation.rarity);

    const add_last_korean = checkBatchimEnding(validation.name) ? '이' : '가';

    // 삼항연산자로
    // 조건 ? true일 때 : false 일 때
    // 입니다.

    // checkBatchimEnding(말 그대로 check 받침 끝ing)함수로 부터
    // true가 넘어오면 '이', false가 넘어오면 '가'가 add_last_korean에 들어갑니다.
    // true 부분에는 '이', '을', '과' 사용 가능
    // false 부분에는 '가', '를', '와' 사용 가능
    return res.status(201).json(`${validation.name}${add_last_korean} 추가 됐습니다.`);
  } catch (error) {
    next(error);
  }
});

// 선수 수정 API
player_router.patch('/player', async (req, res, next) => {
  try {
    const validation = await updated_validation.validateAsync(req.body);
    const is_exit = await table_findFirst(process.env.PLAYERS, { name: validation.name });
    if (!is_exit) return res.status(404).json('해당 선수가 존재하지 않습니다.');

    //수정할 항목 적용
    //입력 안 하면 이전 stats 유지
    const updated_player = {
      rarity: validation.rarity || is_exit.rarity,
      stats_run: validation.stats_run ?? is_exit.stats_run,
      stats_goal_decision: validation.stats_goal_decision ?? is_exit.stats_goal_decision,
      stats_power: validation.stats_power ?? is_exit.stats_power,
      stats_defense: validation.stats_defense ?? is_exit.stats_defense,
      stats_stamina: validation.stats_stamina ?? is_exit.stats_stamina,
    };
    // ||은 false 0 null "" undefined가 ||의 왼쪽에 있으면 ||의 오른쪽 실행
    // ??은 null undefined가 ??의 왼쪽에 있으면 ??의 오른쪽 실행

    await row_update(process.env.PLAYERS, { name: is_exit.name }, updated_player);

    if (updated_player.rarity !== is_exit.rarity) {
      await probabilityAdjustment(updated_player.rarity);
      await probabilityAdjustment(is_exit.rarity);
    }
    // 기존 등급에서는 -1 된 개수로 Range 범위 수정

    const add_last_korean = checkBatchimEnding(is_exit.name) ? '이' : '가';
    return res.status(201).json(`선수 ${validation.name}${add_last_korean} 수정됐습니다.`);
  } catch (error) {
    next(error);
  }
});

// 선수 전체 조회 API
player_router.get('/players', async (req, res, next) => {
  const gambling_list = await prisma.players.findMany({
    select: {
      name: true,
      rarity: true,
      stats_run: true,
      stats_goal_decision: true,
      stats_power: true,
      stats_defense: true,
      stats_stamina: true,
      range: true,
    },
    orderBy: [{ rarity: 'asc' }, { range: 'asc' }],
  });
  return res.status(200).json(gambling_list);
});

// 해당 선수 조회 API
player_router.get('/player', async (req, res, next) => {
  const validation = await name_validation.validateAsync(req.body);
  const is_exit = await table_findFirst(process.env.PLAYERS, { ...validation });
  if (!is_exit) return res.status(404).json('해당 선수가 존재하지 않습니다.');
  return res.status(200).json(is_exit);
});

// 선수 삭제 API
player_router.delete('/player', async (req, res, next) => {
  try {
    const validation = await name_validation.validateAsync(req.body);
    const is_exit = await table_findFirst(process.env.PLAYERS, { ...validation });

    if (!is_exit) return res.status(404).json('해당 선수가 존재하지 않습니다.');

    await row_delete(process.env.PLAYERS, { ...validation });

    await probabilityAdjustment(is_exit.rarity);

    const add_last_korean = checkBatchimEnding(is_exit.name) ? '이' : '가';
    return res.status(201).json(`선수 ${is_exit.name}${add_last_korean} 삭제 됐습니다.`);
  } catch (error) {
    next(error);
  }
});

export default player_router;
