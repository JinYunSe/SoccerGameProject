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

export default rarityPlayerList;
