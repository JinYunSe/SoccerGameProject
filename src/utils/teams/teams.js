import prisma from '../prisma/index.js';
import { Prisma } from '@prisma/client';
import { table_findMany, row_update } from '../tableFunction/table.js';
import { realStat, weightStat } from '../soccer.player/player.js';
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
    let Power = Math.floor(await weightStat(stat[i]));
    teamPower += Power;
    message_data[i] = `${team_member_list[i].list_in}번 ${team_member_list[i].name}, ${Power}`;
  }

  message_data.push(`팀 전력 : ${teamPower}`);

  return message_data;
};

export { findTeam, teamsList, teamsEdit };
