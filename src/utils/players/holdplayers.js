import prisma from '../prisma/index.js';

const holdPlayerSearch = async (account_id) => {
  const list = await prisma.hold_players.findMany({
    where: account_id ? { account_id } : undefined,
    // 삼항 연산자를 이용한 account_id가 있으면 해당 account_id 유저의 보유한 선수만을
    // 없으면 undefined이면 전체 조회를 한다.
    select: {
      account_id: true,
      name: true,
      enforce: true,
      count: true,
      player: {
        select: {
          rarity: true,
        },
      },
    },
    orderBy: {
      account_id: 'asc',
    },
  });
  return list;
};

export { incrementHoldPlayer, addHoldPlayer, holdPlayerSearch };
