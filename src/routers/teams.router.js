import express from 'express';
import prisma from '../utils/prisma/index.js';
import { teamsEdit, teamsList } from '../utils/teams/teams.js';

const router = express.Router();

// 팀 편성

// 0. 자신이 보유한 선수 목록을 조회
router.get('/teams/:account_id', async (req, res, next) => {
  try{
  // 팀 식별 정보 사용
  const { account_id } = req.params;

  // 입력받은 account_id가 존재하는가? -> 인증기능이 들어오면 더 이상 필요x
  const is_exist_team = await prisma.accounts.findFirst({
    where: { account_id: +account_id },
  });
  if (!is_exist_team) return res.status(400).json({ message: '계정이 존재하지 않습니다.' });

  //   // account_id를 기반으로 hold_players에 저장된 같은 account_id를 가진 값을 전부 조회
  const hold_players_list = await prisma.hold_players.findMany({
    where: { account_id: +account_id },
    select: {
      name: true,
      enforece: true,
      count: true,
    },
  });

  // 보유한 선수 목록 반환
  return res.status(200).json({ data: hold_players_list });
} catch(error){
  next(error);
}
});

// 1. 현재 자신의 팀이 어떤 선수로 편성되어 있는지
router.get('/teams/:account_id/list', async (req, res, next) => {
  try{
  // 팀 식별 정보를 사용
  const { account_id } = req.params;

  // 입력받은 account_id가 존재하는가? -> 인증기능이 들어오면 더 이상 필요x
  const is_exist_team = await prisma.accounts.findFirst({
    where: { account_id: +account_id },
  });
  if (!is_exist_team) return res.status(400).json({ message: '계정이 존재하지 않습니다.' });

  // 현재 팀 편성 리스트 반환
  return res.status(200).json({ message: await teamsList(+account_id) });
} catch(error){
  next(error);
}
});

// 2. 1번 선발로 바꿀 멤버, 2번 선발로 바꿀 멤버, 3번 선발로 바꿀 멤버를 동시에,
// 입력받은 데이터가 보유한 선수의 이름이면서
// 단 2번은 1번과 중복이면 안되고, 3번은 1,2번과 중복이면 안된다.
// 데이터를 저장하는 과정에서 에러 발생을 대비해 트랜잭션 롤백기능이 필요함.
router.patch('/teams/:account_id/edit', async (req, res, next) => {
  try{
  // 팀 식별 정보를 사용
  const { account_id } = req.params;

  const { name1, name2, name3 } = req.body;

    //   입력받은 account_id가 존재하는가? -> 인증기능이 들어오면 더 이상 필요x
    const is_exist_team = await prisma.accounts.findFirst({
      where: { account_id: +account_id },
    });
    if (!is_exist_team) return res.status(400).json({ message: '계정이 존재하지 않습니다.' });

    // 선수명을 하나도 입력받지 않았을 때
    if (!(name1 || name2 || name3))
      return res.status(400).json({ message: '선수명을 입력해주세요.' });

    // 입력받은 중복된 선수명이 있는가
    if (name1 === name2 && name1 !== undefined && name2 !== undefined) {
      // 1, 2가 undefined가 아니면서
      // 1, 2가 중복이면 중단
      return res.status(400).json({ message: '입력한 선수명이 중복입니다.' });
      // 다르면 진행
    }

    if (name1 === name3 && name1 !== undefined && name3 !== undefined) {
      // 1, 3가 undefined가 아니면서
      // 1, 3가 중복이면 중단
      return res.status(400).json({ message: '입력한 선수명이 중복입니다.' });
      // 다르면 진행
    }

    if (name2 === name3 && name2 !== undefined && name3 !== undefined) {
      // 2, 3가 undefined가 아니면서
      // 2, 3가 중복이면 중단
      return res.status(400).json({ message: '입력한 선수명이 중복입니다.' });
      // 다르면 진행
    }

    // name1로 입력 받은 선수명 / 입력받은 선수가 보유 중인 선수인가?
    if (name1 !== undefined) await teamsEdit(account_id, 1, name1);

    // name2로 입력 받은 선수명 / 입력받은 선수가 보유 중인 선수인가?
    if (name2 !== undefined) await teamsEdit(account_id, 2, name2);

    // name3로 입력 받은 선수명 / 입력받은 선수가 보유 중인 선수인가?
    if (name3 !== undefined) await teamsEdit(account_id, 3, name3);

    // 현재 팀편성 리스트 반환
    return res.status(200).json({ message: await teamsList(+account_id) });
  } catch(err) {
    next(err);
  }
});

export default router;
