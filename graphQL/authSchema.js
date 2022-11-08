import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { buildSchema } from "graphql";
import { redisCli } from "../modules/redis/redis.js";
import User from '../modules/mongoose/schema/user.js';
import { transport } from '../modules/mail/mail.transport.js';
import { private_key, refresh_priv_key } from '../modules/jwt/index.js';

const SUCCESS = 'success';
const USER_NOT_FOUND = 'user not found';
const PASSWORD_NOT_MATCH = 'password not match';

export const auth_schema = buildSchema(`
    type Query {
        login(email: String!, pwd: String!): String
    }
    
    type Mutation {
        verifyEmail(email: String!): String
        createUser(name: String!, email: String!, pwd: String!, code: String!): String
    }
`)

export const auth_resolver = {
    verifyEmail: async (args, context, info) => {
        const { email } = args;
        let result;
        
        const n = await redisCli.exists(email);
        if (n) await redisCli.del(email);

        if ((await User.findOne({email})) !== null) return "User already exists";

        let code = Math.random().toString(36).substring(2, 8);
        for (let i = 0; i < code.length; i++) {
            if (Math.random() > 0.5) {
                code = code.substring(0, i) + code.substring(i, i + 1).toUpperCase() + code.substring(i + 1);
            }
        }

        try {
            transport.sendMail({
                from: 'Team Oden',
                to: email,
                subject: '[Naruto] 이메일 인증번호가 도착했습니다.',
                html: `
                <table style="margin:auto; text-align:center; padding:0; border-spacing:0; border:0; border-collapse:collapse; width:600px;">
                    <tr>
                        <td style="text-align: center; padding-top: 50px;">
                            <img style="width:90px;height:90px" src="https://cdn-icons-png.flaticon.com/512/2714/2714028.png" alt="Logo" />
                        </td>
                    </tr>
                    <tr>
                        <td style="font-size: 30px;text-align: center;padding-top: 10px;">
                            Welcome to Naruto!
                        </td>
                    </tr>
                    <tr>
                        <td style="font-size: 20px;text-align: center;color: #919191; padding-top: 15px; padding-bottom: 40px;">
                            Here is your verification code.
                        </td>
                    </tr>
                    <tr>
                        <td style="text-align: center;  background-color: #f5f5f5;font-size: 32px; border-radius: 8px; padding-top: 20px;padding-bottom: 20px;padding-right: 60px;padding-left: 60px;">
                            ${code}
                        </td>
                    </tr>
                    <tr>
                        <td style="font-size: 20px;text-align: center;color: #919191; padding-top: 40px;padding-bottom: 70px;">
                            Team Oden
                        </td>
                    </tr>
                </table>
            `});
            await redisCli.set(email, code, { EX: 60 * 5});
            result = "send requested";
        } catch (err) {
            context.res.status(400);
            result = "fail";
        }
        return result;
    },
    createUser: async (args, context, info) => {
        const {name, email, pwd, code} = args;
        const res = context.res;

        const saved_code = await redisCli.get(email, code);
        if (saved_code !== code) {
            res.status(412);
            return "invalid code";
        } else {
            await redisCli.del(email);
            if(await User.findOne({email})) {
                res.status(400);
                return "User already exists";
            } else if (await User.findOne({name})) {
                res.status(400);
                return "Username already exists";
            }
        }
        await new User({name, email, pwd}).save();
        return SUCCESS;
    },
    login: async (args, context, info) => {
        const {email, pwd} = args;
        const res = context.res;

        const usr = await User.findOne({email});
        if (!usr) {
            res.status(404);
            return USER_NOT_FOUND;
        }
        if (!await bcrypt.compare(pwd, usr.pwd)) {
            res.status(401);
            return PASSWORD_NOT_MATCH;
        }
        const token = jwt.sign(
            { _id: usr._id, name: usr.name, email }, private_key,
            { algorithm: 'HS512' , expiresIn: '1h'}
        );
        const refresh_token = jwt.sign(
            { _id: usr._id, name: usr.name, email }, refresh_priv_key,
            { algorithm: 'HS512' , expiresIn: '14d'}
        );
        await User.updateOne({email}, { $set: {refresh_token}});
        res.cookie('token', token, { httpOnly: true });
        res.cookie('refresh_token', refresh_token, { httpOnly: true });
        return SUCCESS;
    }
};
