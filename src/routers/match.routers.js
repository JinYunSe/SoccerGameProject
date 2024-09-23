import express from 'express';
import prisma from '../utils/prisma/index.js';
import { teamCal, matchMaking, winRateCal } from '../utils/match/match.js';
import { findOpponentUsers } from '../utils/users/user.js';
import { realStat, teamsList, weightStat, findTeam } from '../utils/teams/teams.js';
import authMiddleware from '../middleswares/auth.middleware.js';
import joi from 'joi';

const math_router = express.Router();

const opponent_id_validate = joi.object({
  opponent_id: joi.number().integer().min(1).max(2147483647).required(),
});

/*
플레이 매칭(친선 경기)
_비즈니스 로직

1.어카운트 아이디로 상대 아이디의 팀편성 정보를 가져온다.
2.매치 메이킹 함수로 승패 결정.
3.승패 결과는 업데이트 하지 않고, 승패 문자열만 반환해준다.
*/

math_router.post(`/match/:opponent_id`, authMiddleware, async (req, res, next) => {
  try {
    const { account_id } = req.user;
    const { opponent_id } = await opponent_id_validate.validateAsync(req.params);
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

math_router.post(`/rank`, authMiddleware, async (req, res, next) => {
  try {
    //현재 계정의 점수를 찾는다.
    const { account_id, point, win, lose, draw } = req.user;

    //점수 오차범위 100내의 리스트를 구하고, 오차범위내에 상대가 없다면 스코프를 넓힌다.
    let count = 1;
    let opponent_list = [];
    do {
      // 게임 매칭을 잡을 상대방들 찾기
      opponent_list = await findOpponentUsers(account_id, point, count++);
    } while (opponent_list.length === 0);

    // 난수로 상대방 한 유저 지목
    const randomize = Math.floor(Math.random() * opponent_list.length);
    const opponent = opponent_list[randomize];

    // 강화에 따른 수치 반영된 상대 팀
    const opponent_team = await realStat(await findTeam(opponent.account_id));

    // 강화에 따른 수치 반영된 우리 팀
    const my_team = await realStat(await findTeam(account_id));

    let my_sum_weight = 0,
      opponent_team_weigth = 0;

    // 우리팀 선수가 1 ~ 3개 일수 있고,
    // 상대팀 선수가 1 ~ 3개 일수 있어서 반복문 따로 사용
    for (let i = 0; i < my_team.length; i++) {
      my_sum_weight += await weightStat(my_team[i]);
    }

    for (let i = 0; i < opponent_team.length; i++) {
      opponent_team_weigth += await weightStat(opponent_team[i]);
    }

    await matchMaking(my_team, opponent_team, count);

    //return res.status(201).json({ data: current });
    return res.status(200).json('일단 동작 확인');
  } catch (error) {
    next(error);
  }
});

/* 
랭킹 조회 
_비즈니스 로직

1. 포인트 기준으로, 내림차순 정렬 리스트 생성 반환. 
2. 닉네임, 점수, 승,무,패. 팀파워, 승률 보여주기.
*/
math_router.get(`/rank`, authMiddleware, async (req, res, next) => {
  try {
    const accountList = await prisma.accounts.findMany({
      select: {
        account_id: true,
        nickname: true,
        point: true,
        win: true,
        lose: true,
        draw: true,
      },
      orderBy: {
        point: 'desc',
      },
    });

    for (let account of accountList) {
      account.team_power = await teamCal(account.account_id);
    }
    for (let account of accountList) {
      account.win_rate = await winRateCal(account.account_id);
    }

    return res.status(200).json({ data: accountList });
  } catch (error) {
    next(error);
  }
});

//계산 테스트
math_router.get(`/search/:account_id/:list_in`, async (req, res, next) => {
  const { account_id, list_in } = req.params;
  const result = await personalCal(account_id, +list_in);

  return res.status(200).json({ message: `성공`, result: result });
});

//팀 계산 테스트
math_router.get(`/search/:account_id/`, async (req, res, next) => {
  const { account_id } = req.params;
  const result = await teamCal(account_id);

  return res.status(200).json({ message: `성공`, result: result });
});

//임시 유저 계정 조회
math_router.get(`/accounts`, async (req, res, next) => {
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

export default math_router;
