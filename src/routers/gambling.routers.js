import express from 'express';
import { randomNumber01, rarityOutputPrint } from '../utils/Math/gambling.math.js';
import {
  incrementHoldPlayer,
  addHoldPlayer,
  holdPlayerSearch,
} from '../utils/players/holdplayers.js';

import { table_findFirst } from '../utils/tableFunction/table.js';

import joi from 'joi';

import { rarityPlayerList } from '../utils/players/players.js';
import checkBatchimEnding from '../utils/lastkorean/consonants.js';

const account_validate = joi.object({
  account_id: joi.number().integer().min(1).required(),
});

const gambling_router = express.Router();

gambling_router.get('/gambling', async (req, res, next) => {
  // 향후 인증, 인가를 바탕으로 userId 받아오기
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
    id: 2,
    name: result,
  });
  // 현재는 account_id를 인증 및 인가 없이 사용하고 있지만
  // 향후 req.account_id로 바꾸기

  if (exist_hold_player) await incrementHoldPlayer(2, result);
  else await addHoldPlayer(2, result);
  // 현재는 account_id를 인증 및 인가 없이 사용하고 있지만
  // 향후 req.account_id로 바꾸기

  const add_last_korean = checkBatchimEnding(result) ? '이' : '가';
  return res.status(200).json(`${rarity} 등급의 ${result}${add_last_korean} 나왔습니다!!`);

  // 향후 userId를 바탕으로 holdtable 조회해서 해당 선수 추가해주기
  // 기존에 존재 했었으면 count + 1
  // 없었으면 새로 추가
});

gambling_router.get('/gambling/result', async (req, res, next) => {
  return res.status(200).json(await holdPlayerSearch());
});

gambling_router.get('/gambling/:account_id', async (req, res, next) => {
  try {
    const { account_id } = await account_validate.validateAsync(req.params);
    return res.status(200).json(await holdPlayerSearch(account_id));
  } catch (error) {
    next(error);
  }
});

export default gambling_router;
