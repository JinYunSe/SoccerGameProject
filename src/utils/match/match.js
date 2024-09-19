import prisma from '../prisma/index.js';

//편성팀 점수 계산
const teamCal = async (account_id) => {
  let team_summary;

  for (let i = 1; i < 3; i++) {
    team_summary += await personalCal(account_id, i);
  }
  return team_summary;
};

//편성 선수 개인 점수 계산
const personalCal = async (account_id, num) => {
  let summary;
  const selected_player = await prisma.hold_players.findFirst({
    where: { account_id: +account_id, list_in: num },
  });

  const stat_list = await prisma.players.findFirst({
    where: { name: selected_player.name },
  });

  let base =
    stat_list.stats_run * 0.1 +
    stat_list.stats_goal_decision * 0.25 +
    stat_list.stats_power * 0.15 +
    stat_list.stats_defense * 0.3 +
    stat_list.stats_stamina * 0.2;

  switch (stat_list.rarity) {
    case 'SSR':
      summary = base * 1.5;
      break;
    case 'SR':
      summary = base * 1.2;
      break;
    case 'R':
      summary = base;
      break;
    default:
      break;
  }

  return summary;
};

//점수 비교 난수 생성기
const matchMaking = async (user, opponent) => {
  const max_score = user + opponent;

  const randomValue = Math.random() * max_score;

  if (randomValue < max_score * 0.1 || randomValue > max_score * 0.9) {
    return 'draw';
  } else if (randomValue < user) {
    return 'win';
  } else {
    return 'lose';
  }
};

export { teamCal, personalCal, matchMaking };
