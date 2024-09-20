import prisma from '../prisma/index.js';

const rarityPlayerList = async (rarity) => {
  const rarity_players_list = await prisma.players.findMany({
    where: { rarity },
    select: {
      name: true,
      rarity: true,
      stats_run: true,
      stats_goal_decision: true,
      stats_power: true,
      stats_defense: true,
      stats_stamina: true,
      range: true,
    },
    orderBy: {
      range: 'asc',
    },
  });
  for (let i = 0; i < rarity_players_list.length; i++) {
    console.log(i + '체크 : ' + rarity_players_list[i].name);
  }
  return rarity_players_list;
};

// player_id Int pk 가 있었다면prisma.players.count로 등급별 개수를 구하고
// 반복문을 사용해 player_id : (i + 1) 및 rarity로 range를 쉽게 변경할 수 있었을 것 같은데 아쉽다...

const probabilityAdjustment = async (rarity) => {
  const rarity_player_List = await rarityPlayerList(rarity);

  const divisor = rarity_player_List.length;
  // 등급에 따른 선수 목록을 가져옵니다.
  for (let i = 0; i < divisor; i++) {
    await prisma.players.update({
      where: { name: rarity_player_List[i].name, rarity },
      data: {
        range: (i + 1) / divisor,
      },
    });
  }
};

export { rarityPlayerList, probabilityAdjustment };
