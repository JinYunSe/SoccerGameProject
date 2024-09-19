import prisma from '../prisma/index.js';

const existingHoldPlayer = async (account_id, name) => {
  // 해당 유저한테 뽑힌 선수가 있는지 조회
  return await prisma.hold_players.findFirst({
    where: {
      account_id,
      name,
    },
    include: {
      player: {
        select: {
          rarity: true,
        },
      },
    },
  });
};

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

export { existingHoldPlayer, incrementHoldPlayer, addHoldPlayer };
