import express from 'express';

import errorhanding_middleware from './middleswares/errorhanding.middleware.js';
import log_middleware from './middleswares/log.middleswares.js';

import player_router from './routers/player.router.js';
import teams_router from './routers/teams.router.js';
import enforce_router from './routers/enforce_router.js';
import gambling_router from './routers/gambling.routers.js';
import match_router from './routers/match.routers.js';
import account_router from './routers/account.routers.js';

const app = express();
const PORT = 4000;

app.use(log_middleware);
app.use(express.json());

app.use('/api', [
  account_router,
  player_router,
  gambling_router,
  teams_router,
  match_router,
  enforce_router,
]);

app.use(errorhanding_middleware);
app.listen(PORT, () => {
  console.log(PORT + '포트로 서버가 열렸습니다.');
});
