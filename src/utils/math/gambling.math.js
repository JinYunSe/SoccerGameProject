import { table_findMany, row_update } from '../tableFunction/table.js';

const randomNumber01 = () => {
  return Math.random(0, 1);
};

const rarityOutputPrint = (value) => {
  if (0 <= value && value < 0.2) return 'SSR';
  // 20%
  else if (0.2 <= value && value < 0.5) return 'SR';
  // 30%
  else return 'R';
  // 50%

  //로 줄 예정 입니다.
  //현재는 테스트를 위해 위와 같이 적용
};

const probabilityAdjustment = async (rarity) => {
  const rarity_player_List = await table_findMany(
    process.env.PLAYERS,
    { rarity },
    { name: true, rarity: true },
    { orderBy: [{ range: 'asc' }] },
  );

  const divisor = rarity_player_List.length;
  // 등급에 따른 선수 목록을 가져옵니다.

  for (let i = 0; i < divisor; i++) {
    // 새로 추가된 선수는 무조건 range가 1이고
    await row_update(
      process.env.PLAYERS,
      { name: rarity_player_List[i].name, rarity },
      {
        range: (i + 1) / divisor,
      },
    );
  }
};

export { randomNumber01, rarityOutputPrint, probabilityAdjustment };
