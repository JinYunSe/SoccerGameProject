import express from 'express';
import { randomNumber01, rarityOutputPrint } from '../utils/Math/gambling.math.js';
import { rarityPlayerList } from '../utils/players/players.js';
import checkBatchimEnding from '../utils/lastkorean/consonants.js';

const gambling_router = express.Router();

gambling_router.get('/gambling', async (req, res, next) => {
  // 향후 인증, 인가를 바탕으로 userId 받아오기

  const raritynumber = randomNumber01();
  const rarity = await rarityOutputPrint(randomNumber01());

  const rarity_player_list = await rarityPlayerList(rarity);
  // rarityPlayerList를 통해 레어 등급에 해당 하는 선수 목록을 가져옵니다.

  console.log('레어 등급 결정 난수 :' + raritynumber);

  const random_number = randomNumber01();

  console.log('뽑힌 난수 : ' + random_number);

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
  return res.status(200).json(`${rarity} 등급의 ${result} 선수가 나왔습니다!!`);

  // 향후 userId를 바탕으로 holdtable 조회해서 해당 선수 추가해주기
  // 기존에 존재 했었으면 count + 1
  // 없었으면 새로 추가
});

export default gambling_router;
