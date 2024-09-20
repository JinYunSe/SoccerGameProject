import express from 'express';
import prisma from '../utils/prisma/index.js';
import { teamsEdit, teamsList } from '../utils/teams/teams.js';
import joi from 'joi';
import checkBatchimEnding from '../utils/lastkorean/consonants.js';
import authMiddleware from '../middleswares/auth.middleware.js';

const router = express.Router();

// 유효성 검사
const edit_validation = joi.object({
  list_in: joi.number().min(1).max(3).required(),
  name: joi
    .string()
    .pattern(/^[가-힣\s]+$/)
    .min(1)
    .max(20)
    .required(),
});

// 0. 자신이 보유한 선수 목록을 조회
// router.get('/teams/:account_id', async (req, res, next) => {
router.get('/teams', authMiddleware, async (req, res, next) => {
  try {
    // 팀 식별 정보 사용
    const { account_id } = req.user;

    // 입력받은 account_id가 존재하는가? -> 인증기능이 들어오면 더 이상 필요x
    const is_exist_team = await prisma.accounts.findFirst({
      where: { account_id: +account_id },
    });
    if (!is_exist_team) return res.status(400).json({ message: '계정이 존재하지 않습니다.' });

    // account_id를 기반으로 hold_players에 저장된 같은 account_id를 가진 값을 전부 조회
    const hold_players_list = await prisma.hold_players.findMany({
      where: { account_id: +account_id },
      select: {
        name: true,
        enforce: true,
        count: true,
      },
    });

    // 보유한 선수 목록 반환
    return res.status(200).json(hold_players_list);
  } catch (error) {
    next(error);
  }
});

// 1. 현재 자신의 팀이 어떤 선수로 편성되어 있는지
router.get('/teams/list', authMiddleware, async (req, res, next) => {
  try {
    // 팀 식별 정보를 사용
    const { account_id } = req.user;

    // 입력받은 account_id가 존재하는가? -> 인증기능이 들어오면 더 이상 필요x
    const is_exist_team = await prisma.accounts.findFirst({
      where: { account_id: +account_id },
    });
    if (!is_exist_team) return res.status(400).json('계정이 존재하지 않습니다.');

    // 현재 팀 편성 리스트 반환
    return res.status(200).json(await teamsList(+account_id));
  } catch (error) {
    next(error);
  }
});

// 2. 입력한 내용대로 편성 변경
router.patch('/teams/edit', authMiddleware, async (req, res, next) => {
  try {
    // 팀 식별 정보를 사용
    const { account_id } = req.user;
    const inputData = req.body;

    //   입력받은 account_id가 존재하는가? -> 인증기능이 들어오면 더 이상 필요x
    const is_exist_team = await prisma.accounts.findFirst({
      where: { account_id },
    });
    if (!is_exist_team) return res.status(400).json('계정이 존재하지 않습니다.');

    // // 데이터를 하나도 입력받지 않았을 때
    if (inputData.length === 0) return res.status(400).json('교체할 선수 정보를 입력해주세요.');

    // 데이터 유효성 검사
    for (let i = 0; i < inputData.length; i++) {
      await edit_validation.validateAsync(inputData[i]);
    }

    // 번호와 선수명 중복이 있는가
    for (let i = 0; i < inputData.length - 1; i++) {
      for (let j = i + 1; j < inputData.length; j++) {
        if (inputData[i].list_in === inputData[j].list_in)
          return res.status(400).json('선발 번호 중복입니다.');
        if (inputData[i].name === inputData[j].name)
          return res.status(400).json('선수명 중복입니다.');
      }
    }

    // 데이터 베이스와 비교 후 if 문에서 존재 여부 처리해주기

    // // name1로 입력 받은 선수명 / 입력받은 선수가 보유 중인 선수인가?
    for (let i = 0; i < inputData.length; i++) {
      await teamsEdit(account_id, inputData[i].list_in, inputData[i].name);
    }

    // 입력받은 데이터로 변경된 내용만 반환
    let message_data = [];
    inputData.sort((a, b) => a.list_in - b.list_in);
    for (let i = 0; i < inputData.length; i++) {
      const add_last_korean = checkBatchimEnding(inputData[i].name) ? '으로' : '로';
      message_data.push(
        `${inputData[i].list_in}번 선수가 ${inputData[i].name}${add_last_korean} 변경되었습니다.`,
      );
    }

    return res.status(200).json(message_data);
  } catch (err) {
    next(err);
  }
});

export default router;
