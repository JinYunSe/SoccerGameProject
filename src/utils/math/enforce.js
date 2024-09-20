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

export { enforcePlayer };
