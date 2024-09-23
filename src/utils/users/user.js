import { table_findMany } from '../tableFunction/table.js';

// 상대방 유저들 찾기
const findOpponentUsers = async (my_account_id, currentPoint, count) => {
  let rank_scope = 100 * count;
  return await table_findMany(
    process.env.ACCOUNTS,
    {
      // 본인을 제외한 범위 내 유저들 찾기
      NOT: { account_id: my_account_id },
      point: { gte: currentPoint - rank_scope, lte: currentPoint + rank_scope },
    },
    { account_id: true, nickname: true, win: true, draw: true, lose: true, point: true },
  );
};

export { findOpponentUsers };
