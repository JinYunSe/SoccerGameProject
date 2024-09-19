import express from 'express';
import prisma from '../utils/prisma/index.js';
import { teamCal, personalCal, matchMaking } from '../utils/match/match.js';

const play_router = express.Router();

//유저 계정 조회
play_router.get(`/accounts`, async (req, res, next) => {
  const accountList = await prisma.accounts.findMany({
    select: {
      account_id: true,
      nickname: true,
      win: true,
      lose: true,
      draw: true,
      hold_players: {
        select: {
          name: true,
          list_in: true,
        },
      },
    },
  });

  return res.status(200).json({ data: accountList });
});

/*
플레이 매칭

_비즈니스 로직

1.어카운트 아이디로 상대 아이디의 팀편성 정보를 가져온다.
2.유저의 <팀 점수>와 상대 아이디의 <팀 점수> 를 백분위 비교해, 난수 뽑기
3.승패 결과를 어카운트에 업데이트, 결과를 반환해준다.
*/

play_router.post(`/match/:account_id`, async (req, res, next) => {
  const { account_id } = req.params;
  const current_id = req.accounts.account_id;

  let result;

  result = matchMaking(teamCal(account_id), teamCal(current_id));

  return;
});

//계산 테스트
play_router.get(`/search/:account_id/:list_in`, async (req, res, next) => {
  const { account_id, list_in } = req.params;
  const result = await personalCal(account_id, +list_in);

  return res.status(200).json({ message: `성공`, result: result });
});

export default play_router;
