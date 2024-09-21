import express from 'express';
import joi from 'joi';

import { randomNumber01, rarityOutputPrint } from '../utils/Math/gambling.math.js';

import {
  table_findFirst,
  row_create,
  row_update,
  table_findMany,
} from '../utils/tableFunction/table.js';
import { rarityPlayerList } from '../utils/players/players.js';
import { Prisma } from '@prisma/client';
import checkBatchimEnding from '../utils/lastkorean/consonants.js';
import authMiddleware from '../middleswares/auth.middleware.js';
import prisma from '../utils/prisma/index.js';

const account_validate = joi.object({
  account_id: joi.number().integer().min(1).required(),
});

const gambling_router = express.Router();

gambling_router.get('/gambling', authMiddleware, async (req, res) => {
  let { account_id, cash } = req.user;

  if (cash < 1000) return res.status(402).json('케쉬가 부족합니다.');

  const rarity = await rarityOutputPrint(randomNumber01());

  const rarity_player_list = await rarityPlayerList(rarity);

  const random_number = randomNumber01();

  let name = null;
  for (let i = 0; i < rarity_player_list.length; i++) {
    let start_range = 0;
    let end_range = rarity_player_list[i].range;

    if (start_range <= random_number && random_number < end_range) {
      name = rarity_player_list[i].name;
      break;
    }
    start_range = rarity_player_list[i].range;
  }
  console.log(
    '레어 등급 : ' + rarity + '등급 선수 확률 범위 : ' + random_number + '뽑힌 선수 : ' + name,
  );

  cash -= 1000;
  // 유저 캐쉬 1000원 감소

  const exist_hold_player = await table_findFirst(process.env.HOLD_PLAYERS, {
    account_id,
    name,
  });

  await prisma.$transaction(
    async (tx) => {
      if (exist_hold_player) {
        await row_update(
          process.env.HOLD_PLAYERS,
          {
            id: exist_hold_player.id,
          },
          {
            count: {
              increment: 1, // count를 1 증가
            },
          },
          tx,
        );
      } else await row_create(process.env.HOLD_PLAYERS, { account_id, name }, tx);
      await row_update(process.env.ACCOUNTS, { account_id }, { cash }, tx);
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
    },
  );

  const add_last_korean = checkBatchimEnding(name) ? '이' : '가';
  return res.status(200).json(`${rarity} 등급의 ${name}${add_last_korean} 나왔습니다!!`);
});

// 전체 유저 선수 목록 조회
// DB 조회에 사용
gambling_router.get('/gambling/result', async (req, res, next) => {
  return res
    .status(200)
    .json(
      await table_findMany(
        process.env.HOLD_PLAYERS,
        {},
        { player: { select: { rarity: true } } },
        { orderBy: [{ player: { rarity: 'asc' } }] },
      ),
    );
});

// 특정 유저 선수 목록 조회
// DB 조회에 사용
gambling_router.get('/gambling/:account_id', async (req, res, next) => {
  try {
    const { account_id } = await account_validate.validateAsync(req.params);
    return res
      .status(200)
      .json(
        await table_findMany(
          process.env.HOLD_PLAYERS,
          { account_id },
          { player: { select: { rarity: true } } },
          { orderBy: [{ account_id: 'asc' }, { player: { rarity: 'asc' } }] },
        ),
      );
  } catch (error) {
    next(error);
  }
});

export default gambling_router;
