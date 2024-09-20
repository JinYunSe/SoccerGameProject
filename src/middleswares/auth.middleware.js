import jwt from "jsonwebtoken";
import prisma from "../utils/prisma/index.js";

export default async function (req, res, next) {
    try {
        const authorization = req.header.authorization;
        
        if (!authorization) throw new Error("토큰이 존재하지 않습니다.");

        const [tokenType, token] = authorization.split(" ");

        if (!token || tokenType !== process.env.TOKEN_TYPE)
            throw new Error("토큰 형식이 올바르지 않습니다.");

        const decodedToken = jwt.verify(token, process.env.SECRET_KEY);

        const account_id = decodedToken.account_id;

        const user = await prisma.accounts.findFirst({
            where : { account_id },
        });

        if (!user) {
            throw new Error("토큰 사용자가 존재하지 않습니다.");
        }

        req.user = user;
        next();
    }
    catch(error){
        next (error)
    }
}
