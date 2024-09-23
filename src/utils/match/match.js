import { Prisma } from '@prisma/client';
import prisma from '../prisma/index.js';
import { row_update } from '../tableFunction/table.js';

// //점수 비교 게임 플레이 함수
// const matchMaking = async (my_account_id, opponent_accunt_id, my_team, opponent_team, count) => {
//   const max_score = my_team + opponent_team;
//   const randomValue = Math.random() * max_score;

//   if (count === undefined)
//     return await friendMatching(
//       my_account_id,
//       opponent_accunt_id,
//       my_team,
//       opponent_team,
//       randomValue,
//     );
//   // count가 없는 경우의 로직_ 친선전
//   else
//     return await rankMatching(
//       my_account_id,
//       opponent_accunt_id,
//       my_team,
//       opponent_team,
//       count,
//       randomValue,
//     );
//   // count가 있는 경우의 로직_ 랭크전
// };

//친선 경기 매칭_ 점수를 비교해 결과 반환
// const friendMatching = async (
//   my_account_id,
//   opponent_accunt_id,
//   my_team,
//   opponent_team,
//   randomValue,
// ) => {
//   const max_score = my_team + opponent_team;

//   if (randomValue < max_score * 0.1 || randomValue > max_score * 0.9) {
//     return 'draw';
//   } else if (randomValue < user) {
//     return 'win';
//   } else {
//     return 'lose';
//   }
// };

const friendMatching = async (my_team, opponent_team) => {
  const max_score = my_team + opponent_team;
  const score_diff = Math.abs(my_team - opponent_team);

  const draw_probability = Math.max(0, Math.min(0.5, 0.5 - score_diff / max_score));
  // 무승부 확률을 점수 차에 따라 계산(점수 차이가 작을수록 무승부 확률 커진다)

  const remainig_probability = 1 - draw_probability;
  // 무승부를 제외한 확률

  // 각 팀의 승리 확률 계산
  const my_team_win_probability = (my_team / max_score) * remainig_probability;
  const opponent_team_win_probability = (opponent_team / max_score) * remainig_probability;

  const random_number = Math.random();

  console.log(
    '나 : ' +
      my_team_win_probability +
      ', 상대방 : ' +
      opponent_team_win_probability +
      ', 뽑기 : ' +
      random_number,
  );

  if (random_number < my_team_win_probability) return 1;
  //승부를 건 본인 기준 승리
  else if (random_number < my_team_win_probability + draw_probability) return 0;
  // 무승부
  else return -1;
  //승부를 건 본인 기준 패배
};

const resultMatch = async (account_id, opponent_id, result) => {
  //                본인 account id,     상대방 account id   결과
  await prisma.$transaction(
    async (tx) => {
      if (result === 1) {
        await row_update(process.env.ACCOUNTS, { account_id }, { win: { increment: 1 } }, tx);
        await row_update(
          process.env.ACCOUNTS,
          { account_id: opponent_id },
          { lose: { increment: 1 } },
          tx,
        );
      } else if (result === 0) {
        await row_update(process.env.ACCOUNTS, { account_id }, { draw: { increment: 1 } }, tx);
        await row_update(
          process.env.ACCOUNTS,
          { account_id: opponent_id },
          { draw: { increment: 1 } },
          tx,
        );
      } else {
        await row_update(process.env.ACCOUNTS, { account_id }, { lose: { increment: 1 } }, tx);
        await row_update(
          process.env.ACCOUNTS,
          { account_id: opponent_id },
          { win: { increment: 1 } },
          tx,
        );
      }
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
    },
  );

  return result === 1 ? 'win' : result === 0 ? 'draw' : 'lose';
};

const MMRChange = async (
  account_id,
  opponent_account_id,
  my_sum_weight,
  opponent_team_weigth,
  result,
  count,
) => {
  return await prisma.$transaction(
    async (tx) => {
      if (result === 1) {
        const increment_decrement_amplification =
          my_sum_weight > opponent_team_weigth ? 100 / count : 100 * count;

        // 내가 이겼을 때,
        // 내가 강하면 100 / count로 증가치를 줄여주고,
        // 상대방이 강했다면 100 * count로 증가치를 늘려줍니다.

        await row_update(
          process.env.ACCOUNTS,
          { account_id },
          { point: { increment: increment_decrement_amplification } },
          tx,
        );
        await row_update(
          process.env.ACCOUNTS,
          { account_id: opponent_account_id },
          { point: { decrement: increment_decrement_amplification } },
          tx,
        );
        return increment_decrement_amplification;
      } else if (result === -1) {
        const increment_decrement_amplification =
          my_sum_weight < opponent_team_weigth ? 100 / count : 100 * count;

        // 내가 졌을 때,
        // 상대방이 강하면 100 / count로 감소치를 줄여주고,
        // 내가 강했다면 100 * count로 감소치를 늘려줍니다.

        await row_update(
          process.env.ACCOUNTS,
          { account_id },
          { point: { decrement: increment_decrement_amplification } },
          tx,
        );
        await row_update(
          process.env.ACCOUNTS,
          { account_id: opponent_account_id },
          { point: { increment: increment_decrement_amplification } },
          tx,
        );
        return increment_decrement_amplification;
      }
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
    },
  );
};

export { friendMatching, resultMatch, MMRChange };
