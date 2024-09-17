import express from 'express';

import errorhanding_middleware from './middleswares/errorhanding.middleware.js';
import log_middleware from './middleswares/log.middleswares.js';

import gambling_router from './routers/gambling.router.js';
import teams_router from './routers/teams.router.js';

const app = express();
const PORT = 4000;

app.use(log_middleware);
app.use(express.json());

app.use('/api', [gambling_router,teams_router]);

app.use(errorhanding_middleware);
app.listen(PORT, () => {
  console.log(PORT + '포트로 서버가 열렸습니다.');
});
