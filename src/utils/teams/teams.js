import prisma from '../prisma/index.js';
import { Prisma } from '@prisma/client';
import { table_findFirst, table_findMany, row_update } from '../tableFunction/table.js';

const realStat = async (list) => {
  for (let i = 0; i < list.length; i++) {
    const add_status = await table_findFirst(list[i].player.rarity, {
      enforce: list[i].enforce,
    });
    list[i].player.stats_run += add_status.add_run;
    list[i].player.stats_goal_decision += add_status.add_goal_decision;
    list[i].player.stats_power += add_status.add_power;
    list[i].player.stats_defense += add_status.add_defense;
    list[i].player.stats_stamina += add_status.add_stamina;
  }
  console.log(list);
  return list;
};

const statCal = async (list) => {
  let summary;

  let base =
    list.player.stats_run * 0.1 +
    list.player.stats_goal_decision * 0.25 +
    list.player.stats_power * 0.15 +
    list.player.stats_defense * 0.3 +
    list.player.stats_stamina * 0.2;

  switch (list.player.rarity) {
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

  return summary;
};

const teamsEdit = async (account_id, list_in, name) => {
  // name1로 입력 받은 선수명 / 입력받은 선수가 보유 중인 선수인가?
  const is_exist_name = await prisma.hold_players.findFirst({
    where: { account_id, name },
  });
  console.log(is_exist_name);
  // 선수 미보유?
  if (!is_exist_name) return res.status(400).json('해당 선수가 존재하지 않습니다.');

  // 기존 출전번호가 1인 선수가 있는가? 있으면 0으로 변경 없으면 그냥 진행
  const is_exist_list_in = await prisma.hold_players.findFirst({
    where: { account_id, list_in },
  });
  const [listInZero, teamsListUpdate] = await prisma.$transaction(
    async (tx) => {
      // 있으면 0으로 변경하고 진행
      if (is_exist_list_in) {
        const listInZero = await row_update(
          process.env.HOLD_PLAYERS,
          { id: is_exist_list_in.id },
          { list_in: 0 },
          tx,
        );

        // name1 선수의 list_in을 1로 변경
        const teamsListUpdate = await row_update(
          process.env.HOLD_PLAYERS,
          {
            id: is_exist_name.id,
          },
          { list_in },
          tx,
        );
        return [listInZero, teamsListUpdate];
      }

      // 없으면 입력받은 선수명의 list_in을 1로 변경
      else {
        const teamsListUpdate = await row_update(
          process.env.HOLD_PLAYERS,
          {
            id: is_exist_name.id,
          },
          { list_in },
          tx,
        );
        return [teamsListUpdate];
      }
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
    },
  );
};

// 팀 찾기
const findTeam = async (opponent_accunt_id) => {
  console.log('상대방 id : ' + opponent_accunt_id);
  return await table_findMany(
    process.env.HOLD_PLAYERS,
    { account_id: opponent_accunt_id, NOT: { list_in: 0 } },
    {
      list_in: true,
      name: true,
      enforce: true,
      player: {
        select: {
          rarity: true,
          stats_run: true,
          stats_goal_decision: true,
          stats_power: true,
          stats_defense: true,
          stats_stamina: true,
        },
      },
    },
    { orderBy: { list_in: 'asc' } },
  );
};

// 검색된 계정 정보의 hold_players에서 list_in의 값이 0이 아닌 값을 찾음
const teamsList = async (account_id) => {
  const team_member_list = await findTeam(account_id);

  if (team_member_list.length === 0) return '편성된 선수가 없습니다';

  // realStat 함수로 강화가 반영된 편성 리스트를 stat으로 저장
  let stat = await realStat(team_member_list);
  let teamPower = 0;
  let message_data = [];

  for (let i = 0; i < team_member_list.length; i++) {
    let Power = Math.floor(await statCal(stat[i]));
    teamPower += Power;
    message_data[i] = `${team_member_list[i].list_in}번 ${team_member_list[i].name}, ${Power}`;
  }

  message_data.push(`팀 전력 : ${teamPower}`);

  return message_data;
};

//편성 선수 개인 점수 계산 함수
const weightStat = async (game_player) => {
  let summary =
    game_player.player.stats_run * 0.1 +
    game_player.player.stats_goal_decision * 0.25 +
    game_player.player.stats_power * 0.15 +
    game_player.player.stats_defense * 0.3 +
    game_player.player.stats_stamina * 0.2;

  switch (game_player.player.rarity) {
    case 'SSR':
      summary *= 1.5;
      break;
    case 'SR':
      summary *= 1.2;
      break;
    case 'R':
      summary *= 0.9;
      break;
  }

  return Math.floor(summary);
};

export { findTeam, teamsList, teamsEdit, realStat, weightStat };
