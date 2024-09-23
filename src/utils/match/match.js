import prisma from '../prisma/index.js';
import { realStat } from '../teams/teams.js';

//팀 리스트 생성
const teamsList = async (account_id) => {
  const team_member_list = await table_findMany(
    process.env.HOLD_PLAYERS,
    { account_id, NOT: { list_in: 0 } },
    { list_in: true, name: true },
    { orderBy: { list_in: 'asc' } },
  );
  return team_member_list;
};

//편성팀 점수 계산 함수
const teamCal = async (account_id) => {
  let team_summary = 0;
  let team_list = await teamsList(account_id);
  team_list = await realStat(team_list);

  for (let i = 0; i < team_list.length; i++) {
    team_summary += await personalCal(account_id, team_list[i].list_in);
  }
  return team_summary;
};

//편성 선수 개인 점수 계산 함수
const personalCal = async (account_id, num) => {
  let summary = 0;
  const selected_player = await prisma.hold_players.findFirst({
    where: { account_id: +account_id, list_in: num },
  });

  if (!selected_player) {
    return summary; // 정보 없을시 0 반환
  }

  const stat_list = await prisma.players.findFirst({
    where: { name: selected_player.name },
  });

  let base =
    stat_list.stats_run * 0.1 +
    stat_list.stats_goal_decision * 0.25 +
    stat_list.stats_power * 0.15 +
    stat_list.stats_defense * 0.3 +
    stat_list.stats_stamina * 0.2 +
    selected_player.enforece;

  switch (
    stat_list.rarity //db에서 직접 꺼내오는 방식으로,
  ) {
    case 'SSR':
      summary = base * 1.5;
      break;
    case 'SR':
      summary = base * 1.2;
      break;
    case 'R':
      summary = base;
      break;
    default:
      break;
  }

  return Math.floor(summary);
};

//점수 비교 게임 플레이 함수
const matchMaking = async (user, opponent, account_id, opponent_id) => {
  const max_score = user + opponent;
  const randomValue = Math.random() * max_score;

  if (account_id === undefined) {
    // id가 없는 경우의 로직_ 친선전
    return await friendMatching(randomValue, max_score, user);
  } else {
    // id가 있는 경우의 로직_ 랭크전
    return await rankMatching(randomValue, max_score, user, account_id, opponent_id);
  }
};
//친선 경기 매칭_ 점수를 비교해 결과 반환
const friendMatching = async (randomValue, max_score, user) => {
  if (randomValue < max_score * 0.1 || randomValue > max_score * 0.9) {
    return 'draw';
  } else if (randomValue < user) {
    return 'win';
  } else {
    return 'lose';
  }
};

/* 랭크 매칭
주요 골자는 각자의 수준에 따라 점수를 건다는것.

점수가 높은쪽은 150. 낮은쪽은 50을 건다.
이기면 200.(높은쪽은 +50, 낮은쪽은 +150) 지면 -200(높은쪽은 -150, 낮은쪽은 -50)
*/

const rankMatching = async (randomValue, max_score, user, account_id, opponent_id) => {
  let point = 100;
  const higher = (point) => point * 1.5;
  const lower = (point) => point * 0.5;

  // 무승부일 때는 하이매칭이든 로우매칭이든 상관이 없다.
  if (randomValue < max_score * 0.1 || randomValue > max_score * 0.9) {
    await row_update(process.env.accounts, { id: account_id }, { draw: { increment: 1 } });
    await row_update(process.env.accounts, { id: opponent_id }, { draw: { increment: 1 } });
    return 'draw';
  }

  // 하이매칭일 때
  if (account_id.point < opponent_id.point) {
    if (randomValue < user) {
      // 유저가 이겼을 때
      await row_update(
        process.env.accounts,
        { id: account_id },
        { win: { increment: 1 }, point: { increment: higher(point) } },
      );
      await row_update(
        process.env.accounts,
        { id: opponent_id },
        { lose: { increment: 1 }, point: { increment: -higher(point) } },
      );
      return 'win';
    } else {
      // 유저가 졌을 때
      await row_update(
        process.env.accounts,
        { id: account_id },
        { lose: { increment: 1 }, point: { increment: -lower(point) } },
      );
      await row_update(
        process.env.accounts,
        { id: opponent_id },
        { win: { increment: 1 }, point: { increment: lower(point) } },
      );
      return 'lose';
    }
  }

  // 로우매칭일 때
  if (account_id.point > opponent_id.point) {
    if (randomValue < user) {
      // 유저가 이겼을 때
      await row_update(
        process.env.accounts,
        { id: account_id },
        { win: { increment: 1 }, point: { increment: lower(point) } },
      );
      await row_update(
        process.env.accounts,
        { id: opponent_id },
        { lose: { increment: 1 }, point: { increment: -lower(point) } },
      );
      return 'win';
    } else {
      // 유저가 졌을 때
      await row_update(
        process.env.accounts,
        { id: account_id },
        { lose: { increment: 1 }, point: { increment: -higher(point) } },
      );
      await row_update(
        process.env.accounts,
        { id: opponent_id },
        { win: { increment: 1 }, point: { increment: higher(point) } },
      );
      return 'lose';
    }
  }

  // 동률일 때
  if (account_id.point === opponent_id.point) {
    if (randomValue < user) {
      // 유저가 이겼을 때
      await row_update(
        process.env.accounts,
        { id: account_id },
        { win: { increment: 1 }, point: { increment: point } },
      );
      await row_update(
        process.env.accounts,
        { id: opponent_id },
        { lose: { increment: 1 }, point: { increment: -point } },
      );
      return 'win';
    } else {
      // 유저가 졌을 때
      await row_update(
        process.env.accounts,
        { id: account_id },
        { lose: { increment: 1 }, point: { increment: -point } },
      );
      await row_update(
        process.env.accounts,
        { id: opponent_id },
        { win: { increment: 1 }, point: { increment: point } },
      );
      return 'lose';
    }
  }
};

//db 업데이트 문
const row_update = async (table_name, where_condition, value, tx) => {
  const db = tx ? tx : prisma;
  return await db[table_name].update({
    where: { ...where_condition },
    data: {
      ...value,
    },
  });
};

export { teamCal, personalCal, matchMaking };
