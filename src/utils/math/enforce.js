import prisma from '../prisma/index.js';

const enforcePlayer = async (id, enforce) => {
  return await prisma.hold_players.update({
    // 동적 테이블 이름 접근
    where: { id },
    data: {
      enforce: {
        increment: 1,
      },
      count: {
        decrement: enforce,
      },
    },
  });
};

const rarityRowCreate = async (tableName, value) => {
  await prisma[tableName].create({
    // 동적 테이블로 SSR, SR, R 등급 강화 별 스텟 증가량 만들기
    data: {
      ...value,
    },
  });
};

export { enforcePlayer, rarityRowCreate };
