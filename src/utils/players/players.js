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

const probabilityAdjustment = async (rarity, cud) => {
  const rarity_player_list = await rarityPlayerList(rarity);

  if (cud === 'create' || cud === 'update') {
    for (let i = 1; i < rarity_player_list.length + 1; i++) {
      await prisma.players.update({
        where: { name: rarity_player_list[i - 1].name, rarity },
        data: {
          range: i / (rarity_player_list.length + 1),
        },
      });
    }
  }
  if (cud === 'delete' || cud === 'update') {
    for (let i = 1; i <= rarity_player_list.length; i++) {
      await prisma.players.update({
        where: { name: rarity_player_list[i - 1].name, rarity },
        data: {
          range: i / rarity_player_list.length,
        },
      });
    }
  }
};

export { rarityPlayerList, probabilityAdjustment };
