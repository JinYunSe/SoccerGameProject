import express from 'express';
import joi from 'joi';

import { randomNumber01, rarityOutputPrint } from '../utils/Math/gambling.math.js';
import {
  incrementHoldPlayer,
  addHoldPlayer,
  holdPlayerSearch,
} from '../utils/players/holdplayers.js';
import { table_findFirst } from '../utils/tableFunction/table.js';
import { rarityPlayerList } from '../utils/players/players.js';
import checkBatchimEnding from '../utils/lastkorean/consonants.js';
import authMiddleware from '../middleswares/auth.middleware.js';

const account_validate = joi.object({
  account_id: joi.number().integer().min(1).required(),
});

const gambling_router = express.Router();

gambling_router.get('/gambling', authMiddleware, async (req, res, next) => {
  const account_id = req.user.account_id;
  const rarity = await rarityOutputPrint(randomNumber01());

  const rarity_player_list = await rarityPlayerList(rarity);

  const random_number = randomNumber01();

  let result = null;
  for (let i = 0; i < rarity_player_list.length; i++) {
    let start_range = 0;
    let end_range = rarity_player_list[i].range;

    if (start_range <= random_number && random_number < end_range) {
      result = rarity_player_list[i].name;
      break;
    }
    start_range = rarity_player_list[i].range;
  }
  console.log(
    '레어 등급 : ' + rarity + '등급 선수 확률 범위 : ' + random_number + '뽑힌 선수 : ' + result,
  );

  const exist_hold_player = await table_findFirst(process.env.HOLD_PLAYERS, {
    account_id,
    name: result,
  });

  if (exist_hold_player) await incrementHoldPlayer(account_id, result);
  else await addHoldPlayer(account_id, result);
  // 기존에 존재 했었으면 count + 1
  // 없었으면 새로 추가

  const add_last_korean = checkBatchimEnding(result) ? '이' : '가';
  return res.status(200).json(`${rarity} 등급의 ${result}${add_last_korean} 나왔습니다!!`);
});

// 전체 유저 선수 목록 조회
gambling_router.get('/gambling/result', async (req, res, next) => {
  return res.status(200).json(await holdPlayerSearch());
});

// 특정 유저 선수 목록 조회
gambling_router.get('/gambling/:account_id', async (req, res, next) => {
  try {
    const { account_id } = await account_validate.validateAsync(req.params);
    return res.status(200).json(await holdPlayerSearch(account_id));
  } catch (error) {
    next(error);
  }
});

export default gambling_router;
