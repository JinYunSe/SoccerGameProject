import { table_findMany } from '../tableFunction/table.js';

// 상대방 유저들 찾기
const findOpponentUsers = async (my_account_id, current_point, count) => {
  let rank_scope = 100 * count;
  return await table_findMany(
    process.env.ACCOUNTS,
    {
      // 본인을 제외한 범위 내 유저들 찾기
      NOT: { account_id: my_account_id },
      point: { gte: current_point - rank_scope, lte: current_point + rank_scope },
      // 현재 코드를 본 결과 유저의 밀집도가 낮을 경우 음의 영역까지
      // 범위를 탐색하는 문제가 발생할 수 있다는 사실을 알았다.
    },
    { account_id: true, nickname: true, win: true, draw: true, lose: true, point: true },
  );
};

export { findOpponentUsers };
