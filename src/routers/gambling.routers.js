import express from 'express';
import prisma from '../utils/prisma/index.js';
import { randomNumber01, rarityOutputPrint } from '../utils/Math/gambling.math.js';
//import checkBatchimEnding from '../utils/lastkorean/consonants.js';
//import joi from 'joi';

const gambling_router = express.Router();

gambling_router.get('/gambling', async (req, res, next) => {
  const rarity = rarityOutputPrint(randomNumber01());
  const rarity_player_list = await prisma.players.findMany({
    where: {
      rarity,
    },
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
  });
  return res.status(200).json(rarity_player_list);
});

export default gambling_router;
