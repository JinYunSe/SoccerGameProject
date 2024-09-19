import prisma from '../prisma/index.js';
import { Prisma } from '@prisma/client';

export const teamsEdit = async (account_id, list_in, name) => {
  // name1로 입력 받은 선수명 / 입력받은 선수가 보유 중인 선수인가?
  const is_exist_name = await prisma.hold_players.findFirst({
    where: { account_id: +account_id, name: name },
  });

  // 선수 미보유?
  if (!is_exist_name) return res.status(400).json({ message: '해당 선수가 존재하지 않습니다.' });

  // 기존 출전번호가 1인 선수가 있는가? 있으면 0으로 변경 없으면 그냥 진행
  const is_exist_list_in = await prisma.hold_players.findFirst({
    where: { account_id: +account_id, list_in: list_in },
  });

  const [listInZero, teamsListUpdate] = await prisma.$transaction(
    async (tx) => {
      // 있으면 0으로 변경하고 진행
      if (is_exist_list_in) {
        console.log('name 실행');
        const listInZero = await tx.hold_players.update({
          data: {
            list_in: 0,
          },
          where: {
            account_id_name: { account_id: +account_id, name },
            list_in: list_in,
          },
        });

        // name1 선수의 list_in을 1로 변경
        const teamsListUpdate = await tx.hold_players.update({
          data: { list_in: list_in },
          where: {
            account_id_name: { account_id: +account_id, name },
          },
        });
        return [listInZero, teamsListUpdate];
      }

      // 없으면 입력받은 선수명의 list_in을 1로 변경
      else {
        const teamsListUpdate = await tx.hold_players.update({
          data: {
            list_in: list_in,
          },
          where: {
            account_id_name: { account_id: +account_id, name },
          },
        });
        return [teamsListUpdate];
      }
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
    },
  );
};

// 검색된 계정 정보의 hold_players에서 list_in의 값이 0이 아닌 값을 찾음
export const teamsList = async (account_id) => {
  const team_member_list = await prisma.hold_players.findMany({
    where: { account_id: +account_id, NOT: { list_in: 0 } },
    select: { list_in: true, name: true },
    orderBy: { list_in: 'asc' },
  });

  let message_data = [];

  for (let i = 0; i < team_member_list.length; i++) {
    message_data[i] = `${team_member_list[i].list_in}번 ${team_member_list[i].name}`;
  }

  // 반환
  return message_data;
};
