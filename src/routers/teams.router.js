import express from 'express';
import prisma from '../utils/prisma/index.js';
import joi from 'joi';

const router = express.Router();

// 팀 편성
// 0. 자신이 보유한 선수 목록을 조회
router.get('/teams/:account_id', async (req, res, next) => {
<<<<<<< Updated upstream
  // 팀 식별 정보 사용
  const { account_id } = req.params;
=======
  try {
    // 팀 식별 정보 사용
    const { account_id } = req.params;
>>>>>>> Stashed changes

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

<<<<<<< Updated upstream
  // 반환
  return res.status(200).json({ data: hold_players_list });
=======
    // 보유한 선수 목록 반환
    return res.status(200).json({ data: hold_players_list });
  } catch (error) {
    next(error);
  }
>>>>>>> Stashed changes
});

// 1. 현재 자신의 팀이 어떤 선수로 편성되어 있는지
router.get('/teams/:account_id/list', async (req, res, next) => {
<<<<<<< Updated upstream
  // 팀 식별 정보를 사용
  const { account_id } = req.params;
=======
  try {
    // 팀 식별 정보를 사용
    const { account_id } = req.params;
>>>>>>> Stashed changes

    // 입력받은 account_id가 존재하는가? -> 인증기능이 들어오면 더 이상 필요x
    const is_exist_team = await prisma.accounts.findFirst({
      where: { account_id: +account_id },
    });
    if (!is_exist_team) return res.status(400).json({ message: '계정이 존재하지 않습니다.' });

<<<<<<< Updated upstream
  // 검색된 계정 정보의 hold_players에서 list_in의 값이 1~3인 값을 찾음
  const team_member_list = await prisma.hold_players.findMany({
    where: { account_id: +account_id, list_in: { in: [1, 2, 3] } },
    select: { list_in: true, name: true },
    orderBy: { list_in: 'asc'}
  });

  // console.log("linstin이 0이 있으면 오류 발생")
  console.log(team_member_list.length);
  //   console.log(team_member_list);

  let message_data = [];

  for (let i = 0; i < team_member_list.length; i++) {
    message_data[i] = `${team_member_list[i].list_in}번 ${team_member_list[i].name}`;
  }

  // 반환
  return res.status(200).json({ message: message_data });
=======
    // 현재 팀 편성 리스트 반환
    return res.status(200).json({ message: await teamsList(+account_id) });
  } catch (error) {
    next(error);
  }
>>>>>>> Stashed changes
});


// 2. 1번 선발로 바꿀 멤버, 2번 선발로 바꿀 멤버, 3번 선발로 바꿀 멤버를 동시에,
// 입력받은 데이터가 보유한 선수의 이름이면서
// 단 2번은 1번과 중복이면 안되고, 3번은 1,2번과 중복이면 안된다.
// 데이터를 저장하는 과정에서 에러 발생을 대비해 트랜잭션 롤백기능이 필요함.
router.patch('/teams/:account_id/edit', async (req, res, next) => {
<<<<<<< Updated upstream
  // 팀 식별 정보를 사용
  const { account_id } = req.params;
=======
  try {
    // 팀 식별 정보를 사용
    const { account_id } = req.params;
>>>>>>> Stashed changes

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
  if (name1 !== undefined) {
    const is_exist_name1 = await prisma.hold_players.findFirst({
      where: { account_id: +account_id, name: name1 },
    });

    // 선수 미보유?
    if (!is_exist_name1) return res.status(400).json({ message: '해당 선수가 존재하지 않습니다.' });

<<<<<<< Updated upstream
    // 기존 출전번호가 1인 선수가 있는가? 있으면 0으로 변경 없으면 그냥 진행
    const is_exist_list_in1 = await prisma.hold_players.findFirst({
      where: { account_id: +account_id, list_in: 1 },
    });
    console.log(is_exist_list_in1);

    // 있으면 0으로 변경하고 진행
    if (is_exist_list_in1) {
      console.log('name1 실행');
      await prisma.hold_players.update({
        data: {
          list_in: 0,
        },
        where: { account_id: +account_id, list_in: 1, name: is_exist_list_in1.name },
      });

      // name1 선수의 list_in을 1로 변경
      await prisma.hold_players.update({
        data: { list_in: 1 },
        where: { account_id: +account_id, name: name1 },
      });
=======
    // 입력받은 중복된 선수명이 있는가
    if (name1 === name2 && name1 !== undefined) {
      // 1, 2가 undefined가 아니면서
      // 1, 2가 중복이면 중단
      return res.status(400).json({ message: '입력한 선수명이 중복입니다.' });
      // 다르면 진행
>>>>>>> Stashed changes
    }

    // 없으면 입력받은 선수명의 list_in을 1로 변경
    if (!is_exist_list_in1) {
      await prisma.hold_players.update({
        data: {
          list_in: 1,
        },
        where: { account_id: +account_id, name: name1 },
      });
    }
  }
    // name1 완료


    // name2로 입력 받은 선수명 / 입력받은 선수가 보유 중인 선수인가?
    if (name2 !== undefined) {
      console.log('name2 실행');
      const is_exist_name2 = await prisma.hold_players.findFirst({
        where: { account_id: +account_id, name: name2 },
      });

      // 선수 미보유?
      if (!is_exist_name2)
        return res.status(400).json({ message: '해당 선수가 존재하지 않습니다.' });

      // 기존 출전번호가 2인 선수가 있는가? 있으면 0으로 변경 없으면 그냥 진행
      const is_exist_list_in2 = await prisma.hold_players.findFirst({
        where: { account_id: +account_id, list_in: 2 },
      });
      console.log(is_exist_list_in2);

      // 있으면 0으로 변경하고 진행
      if (is_exist_list_in2) {
        await prisma.hold_players.update({
          data: {
            list_in: 0,
          },
          where: { account_id: +account_id, list_in: 2, name: is_exist_list_in2.name },
        });

        // name2 선수의 list_in을 2로 변경
        await prisma.hold_players.update({
          data: { list_in: 2 },
          where: { account_id: +account_id, name: name2 },
        });
      }

      // 없으면 입력받은 선수명의 list_in을 2로 변경
      if (!is_exist_list_in2) {
        await prisma.hold_players.update({
          data: {
            list_in: 2,
          },
          where: { account_id: +account_id, name: name2 },
        });
      }
    }
    // name2 완료


    // name3로 입력 받은 선수명 / 입력받은 선수가 보유 중인 선수인가?
    if (name3 !== undefined) {
      console.log('name3 실행');
      const is_exist_name3 = await prisma.hold_players.findFirst({
        where: { account_id: +account_id, name: name3 },
      });

<<<<<<< Updated upstream
      // 선수 미보유?
      if (!is_exist_name3)
        return res.status(400).json({ message: '해당 선수가 존재하지 않습니다.' });

      // 기존 출전번호가 3인 선수가 있는가? 있으면 0으로 변경 없으면 그냥 진행
      const is_exist_list_in3 = await prisma.hold_players.findFirst({
        where: { account_id: +account_id, list_in: 3 },
      });
      console.log(is_exist_list_in3);

      // 있으면 0으로 변경하고 진행
      if (is_exist_list_in3) {
        await prisma.hold_players.update({
          data: {
            list_in: 0,
          },
          where: { account_id: +account_id, list_in: 3, name: is_exist_list_in3.name },
        });

        // name2 선수의 list_in을 2로 변경
        await prisma.hold_players.update({
          data: { list_in: 3 },
          where: { account_id: +account_id, name: name3 },
        });
      }

      // 없으면 입력받은 선수명의 list_in을 3로 변경
      if (!is_exist_list_in3) {
        await prisma.hold_players.update({
          data: {
            list_in: 3,
          },
          where: { account_id: +account_id, name: name3 },
        });
      }
      // name3 완료
    }

    
  // 검색된 계정 정보의 hold_players에서 list_in의 값이 1~3인 값을 찾음
  const team_member_list = await prisma.hold_players.findMany({
    where: { account_id: +account_id, list_in: { in: [1, 2, 3] } },
    select: { list_in: true, name: true },
    orderBy: { list_in: 'asc'}
  });

    let message_data = [];

    for (let i = 0; i < team_member_list.length; i++) {
      message_data[i] = `${team_member_list[i].list_in}번 ${team_member_list[i].name}`;
    }
  
    // 반환
    return res.status(200).json({ message: message_data });
=======
    // 현재 팀편성 리스트 반환
    return res.status(200).json({ message: await teamsList(+account_id) });
  } catch (err) {
    next(err);
>>>>>>> Stashed changes
  }
);

export default router;
