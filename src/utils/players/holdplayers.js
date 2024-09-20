import prisma from '../prisma/index.js';

const incrementHoldPlayer = async (account_id, name) => {
  // 이미 존재하는 경우 count 증가
  await prisma.hold_players.update({
    where: {
      account_id_name: {
        account_id, // userId는 나중에 받아오는 값으로 교체
        name,
      },
    },
    data: {
      count: {
        increment: 1, // count를 1 증가
      },
    },
  });
};

const addHoldPlayer = async (account_id, name) => {
  // 존재하지 않는 경우 새로 추가
  await prisma.hold_players.create({
    data: {
      account_id,
      name,
    },
  });
};

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
