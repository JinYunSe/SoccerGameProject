import prisma from "../utils/prisma/index.js";
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Joi from "joi";

const router = express.Router();

const account_vaildation = Joi.object({
    id : Joi.string().pattern(/^[a-zA-Z0-9]+$/).min(1).max(191).required(),
    password : Joi.string().pattern(/^[a-zA-Z0-9]+$/).min(1).max(191).required(),
    confirmedPassword : Joi.string().pattern(/^[a-zA-Z0-9]+$/).min(1).max(191).required(),
    name : Joi.string().pattern(/^[a-zA-Z0-9]+$/).min(1).max(191).required(),
    nickname : Joi.string().min(1).max(191).required(),
});

const id_password = Joi.object({
    id: joi
      .string()
      .min(1)
      .max(191)
      .pattern(/^[a-zA-Z0-9]+$/)
      .required(),
    password: joi
      .string()
      .min(1)
      .max(191)
      .pattern(/^[a-zA-Z0-9]+$/)
      .required(),
  })

// 회원가입 API
router.post("/sign-up", async (req, res) => {
    try {
        const vaildation = await account_vaildation.validateAsync(req.body);
        const {id, password, confirmedPassword, name, nickname} = vaildation;

        const isExistUser = await prisma.accounts.findFirst({
            where: { id },
        });
        if (isExistUser) return res.status(409).json("존재하는 아이디입니다.")
        if (password !== confirmedPassword) return res.status(400).json("비밀번호가 일치하지 않습니다.")
        
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.accounts.create({
            data: {
                id,
                password: hashedPassword,
                name,
                nickname,
            },
        });

        return res.status(201).json("회원가입에 성공했습니다.");
    } catch (error) {
        next(error)
    }
});

// 로그인 API
router.post("/sign-in", async (req, res) => {
    try {
        const { id, password } = await id_password.validateAsync(req.body);
        
        const user = await prisma.accounts.findFirst({
            where : {
                id,
            },
        });

        if (!user) return res.status(401).json("아이디가 존재하지 않습니다.");
        else if (!(await bcrypt.compare(password, user.password))) return res.status(401).json("비밀번호가 일치하지 않습니다.");
        

        const token = jwt.sign(
            { account_id : user.id },process.env.JWT_SECRET
        );

        res.header(process.env.TOKEN_KEY,  `${process.env.TOKEN_TYPE} ${token}`);
        return res.status(200).json({ message: "로그인 성공" });
    } catch (error) {
        next(error)
    }
});

export default router;
