import { row_update } from '../tableFunction/table.js';
import { table_findFirst } from '../tableFunction/table.js';
const playerCountChange = async (exist_hold_player) => {
  return await row_update(
    process.env.HOLD_PLAYERS,
    { id: exist_hold_player.id },
    { enforce: exist_hold_player.enforce, count: exist_hold_player.count },
  );
};

//편성 선수 개인 점수 계산 함수
const weightStat = async (game_player) => {
  let summary =
    game_player.player.stats_run * 0.1 +
    game_player.player.stats_goal_decision * 0.25 +
    game_player.player.stats_power * 0.15 +
    game_player.player.stats_defense * 0.3 +
    game_player.player.stats_stamina * 0.2;

  switch (game_player.player.rarity) {
    case 'SSR':
      summary *= 1.5;
      break;
    case 'SR':
      summary *= 1.2;
      break;
    case 'R':
      summary *= 0.9;
      break;
  }

  return Math.floor(summary);
};

const realStat = async (list) => {
  for (let i = 0; i < list.length; i++) {
    const add_status = await table_findFirst(list[i].player.rarity, {
      enforce: list[i].enforce,
    });
    list[i].player.stats_run += add_status.add_run;
    list[i].player.stats_goal_decision += add_status.add_goal_decision;
    list[i].player.stats_power += add_status.add_power;
    list[i].player.stats_defense += add_status.add_defense;
    list[i].player.stats_stamina += add_status.add_stamina;
  }
  console.log(list);
  return list;
};

export { playerCountChange, weightStat, realStat };
