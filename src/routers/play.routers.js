import express from 'express';
import prisma from '../utils/prisma/index.js';
import { teamCal, personalCal, matchMaking } from '../utils/match/match.js';
import authMiddleware from '../middleswares/auth.middleware.js';
import joi from 'joi';

const play_router = express.Router();

/*
플레이 매칭(친선 경기)
_비즈니스 로직

1.어카운트 아이디로 상대 아이디의 팀편성 정보를 가져온다.
2.매치 메이킹 함수로 승패 결정.
3.승패 결과는 업데이트 하지 않고, 승패 문자열만 반환해준다.
*/

play_router.post(`/match/:opponent_id`, authMiddleware, async (req, res, next) => {
  try {
    const { account_id } = req.user;
    const { opponent_id } = req.params;
    const opponent = await prisma.accounts.findFirst({
      where: { account_id: opponent_id },
      select: {
        account_id: true,
      },
    });

    let result;

    result = await matchMaking(await teamCal(account_id), await teamCal(opponent_id));

    return res.status(201).json({ result: result });
  } catch (error) {
    next(error);
  }
});

/* 
랭크 매칭
_비즈니스 로직

1. 기본 디폴트 점수는 1000으로 시작.
2. 어카운트 아이디 리스트 뽑기
2-1. 점수 기준으로 내림차순 정렬 - 랭킹 조회
2-2. 어카운트 점수를 받아옴. > 점수대의 +- 100점 인 어카운트 리스트 뽑기
3. 리스트의 개수 사이에서 난수 생성
4. 매칭 - 결과 문자열과 점수변화를 반환한다.
5. 승 패 점수 +-10점 무승부 변함없음 
**IF 상대의 점수가 나보다 높았다면 +5, 나보다 낮았다면 -5 증감치.
*/

play_router.post(`/rank`, authMiddleware, async (req, res, next) => {
  try {
    //현재 계정의 점수를 찾는다.
    const { account_id } = req.user;
    const current = await prisma.accounts.findFirst({
      where: { account_id: account_id },
      select: { id: true, point: true, win: true, lose: true, draw: true },
    });

    const currentPoint = current.point;

    //점수 오차범위 100내의 리스트를 구한다.
    const accountList = await prisma.accounts.findMany({
      where: {
        point: {
          gte: currentPoint - 100, // 현재 계정의 점수 -100보다 크거나 같은 값
          lte: currentPoint + 100, // 현재 계정의 점수 +100보다 작거나 같은 값
        },
      },

      select: {
        account_id: true,
        nickname: true,
        point: true,
      },
      orderBy: {
        point: 'desc',
      },
    });

    //randomize_ 난수 생성후 난수번호의 아이디 찾기.
    const randomize = Math.floor(Math.random() * accountList.length);
    const opponent = accountList[randomize].account_id;

    //랭크 매칭 승패 계산
    await matchMaking(await teamCal(account_id), await teamCal(opponent), account_id, opponent);

    return res.status(201).json({ data: current });
  } catch (error) {
    next(error);
  }
});

/* 
랭킹 조회 
_비즈니스 로직

1. 포인트 기준으로, 내림차순 정렬 리스트 생성 반환
*/
play_router.get(`/rank`, authMiddleware, async (req, res, next) => {
  const accountList = await prisma.accounts.findMany({
    select: {
      account_id: true,
      nickname: true,
      point: true,
    },
    orderBy: {
      point: 'Desc',
    },
  });

  return res.status(200).json({ data: accountList });
});

//계산 테스트
play_router.get(`/search/:account_id/:list_in`, async (req, res, next) => {
  const { account_id, list_in } = req.params;
  const result = await personalCal(account_id, +list_in);

  return res.status(200).json({ message: `성공`, result: result });
});

//팀 계산 테스트
play_router.get(`/search/:account_id/`, async (req, res, next) => {
  const { account_id } = req.params;
  const result = await teamCal(account_id);

  return res.status(200).json({ message: `성공`, result: result });
});

//임시 유저 계정 조회
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

export default play_router;
