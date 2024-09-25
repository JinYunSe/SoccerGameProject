import express from 'express';
import { friendMatching, resultMatch, MMRChange } from '../utils/match/match.js';
import { findOpponentUsers } from '../utils/users/user.js';
import { findTeam } from '../utils/teams/teams.js';
import { weightStat, realStat } from '../utils/soccer.player/player.js';
import { table_findMany } from '../utils/tableFunction/table.js';
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

    if (account_id === opponent_id) return res.status(404).json('상대방을 선택해주세요');
    // 강화에 따른 수치 반영된 우리 팀
    const my_team = await realStat(await findTeam(account_id));

    if (my_team.length === 0) return res.status(404).json('팀 편성을 먼저해주세요');

    // 강화에 따른 수치 반영된 상대 팀
    const opponent_team = await realStat(await findTeam(opponent_id));

    if (opponent_team.length === 0) return res.status(404).json('상대 팀이 존재하지 않습니다.');

    let my_team_weight = 0,
      opponent_team_weigth = 0;

    // 우리팀 선수가 1 ~ 3개 일수 있고,
    // 상대팀 선수가 1 ~ 3개 일수 있어서 반복문 따로 사용
    for (let i = 0; i < my_team.length; i++) {
      my_sum_weight += await weightStat(my_team[i]);
    }

    for (let i = 0; i < opponent_team.length; i++) {
      opponent_team_weigth += await weightStat(opponent_team[i]);
    }

    const result = await friendMatching(my_team_weight, opponent_team_weigth);

    const win_draw_lose = result === 1 ? 'win' : result === -1 ? 'lose' : 'draw';
    return res.status(200).json(`${win_draw_lose}`);
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
5. 승 패 점수 +-100 * count, +- 100 / count점, 무승부 변함없음
*/

math_router.post(`/rank`, authMiddleware, async (req, res, next) => {
  try {
    //현재 계정의 점수를 찾는다.
    const { account_id, point, win, lose, draw } = req.user;

    // 강화에 따른 수치 반영된 우리 팀
    const my_team = await realStat(await findTeam(account_id));

    if (my_team.length === 0) return res.status(404).json('팀 편성 먼저 해주세요');

    let opponent_team = null;
    let opponent = null;
    let count = 1;
    let infinity = 0;
    do {
      //점수 오차범위 100내의 리스트를 구하고, 오차범위내에 상대가 없다면 스코프를 넓힌다.
      let opponent_list = [];
      do {
        // 게임 매칭을 잡을 상대방들 찾기(본인 안 찾아집니다)
        opponent_list = await findOpponentUsers(account_id, point, count++);
      } while (opponent_list.length === 0);

      // 난수로 상대방 한 유저 지목
      const randomize = Math.floor(Math.random() * opponent_list.length);
      opponent = opponent_list[randomize];

      // 강화에 따른 수치 반영된 상대 팀
      opponent_team = await realStat(await findTeam(opponent.account_id));

      if (opponent_team.length === 0 && infinity !== 10) {
        count--;
        infinity++;
      }
      // 상대 팀에 선수가 존재하지 않으면 다시 상대 찾기
      // 범위 내에 상대방이 그 선수 밖에 없을 경우 10번 반복 후
      // 범위를 늘려가며 다른 선수를 찾는다.(그에 따른 가중치도 바뀌게 된다.)
      // 범위가 넓어질수록 어차피 이길 확률이 높은 게임은 더 이길 확률이 높아지고,
      // 질 확률이 높은 게임은 더 질 확률이 높아지게 된다.

      // 그에 따른 격차에 따라 패배시 점수가 낮게 낮아지고
      // 승리시 점수가 낮게 증가한다.
      // MMRChange에 그렇게 구현했습니다.
    } while (opponent_team.length === 0);

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

    const result = await friendMatching(my_sum_weight, opponent_team_weigth);

    const win_draw_lose = await resultMatch(account_id, opponent.account_id, result, count);

    const add_min = await MMRChange(
      account_id,
      opponent.account_id,
      my_sum_weight,
      opponent_team_weigth,
      result,
      count,
    );

    return result === 1
      ? res.status(200).json(`${win_draw_lose}, point : ${add_min} 증가했습니다`)
      : result === -1
        ? res.status(200).json(`${win_draw_lose}, point : ${add_min} 감소했습니다.`)
        : res.status(200).json(`${win_draw_lose}`);
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

math_router.get('/rank', async (req, res, next) => {
  return res
    .status(200)
    .json(
      await table_findMany(
        process.env.ACCOUNTS,
        {},
        { nickname: true, point: true, win: true, draw: true, lose: true },
        { orderBy: [{ point: 'desc' }, { win: 'desc' }, { draw: 'desc' }, { lose: 'asc' }] },
      ),
    );
});
// 새로 만들기

export default math_router;
