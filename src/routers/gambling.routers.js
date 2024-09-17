import express from 'express';
import prisma from '../utils/prisma/index.js';
import { randomNumber01, rarityOutputPrint } from '../utils/Math/gambling.math.js';
import { rarityPlayerList } from '../utils/players/players.js';
//import checkBatchimEnding from '../utils/lastkorean/consonants.js';
//import joi from 'joi';

const gambling_router = express.Router();

gambling_router.get('/gambling', async (req, res, next) => {
  const rarity = rarityOutputPrint(randomNumber01());

  return res.status(200).json(rarity_player_list);
});

export default gambling_router;
