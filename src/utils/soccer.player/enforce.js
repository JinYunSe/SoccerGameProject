import { row_update } from '../tableFunction/table.js';

const playerCountChange = async (exist_hold_player) => {
  return await row_update(
    process.env.HOLD_PLAYERS,
    { id: exist_hold_player.id },
    { enforce: exist_hold_player.enforce, count: exist_hold_player.count },
  );
};

export { playerCountChange };
