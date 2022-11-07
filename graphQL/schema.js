import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { buildSchema } from "graphql";
import User from '../modules/mongoose/schema/user.js';
import {private_key, refresh_priv_key} from '../modules/jwt/index.js';
import {redisCli} from "../modules/redis/redis.js";

const SUCCESS = 'success';
const USER_NOT_FOUND = 'user not found';
const PASSWORD_NOT_MATCH = 'password not match';

export const schema = buildSchema(`    
    type User {
        name: String!
        email: String!
        c_date: Float
        DATE: [Float]
    }
    
    type Query {
        users: [User]
        user(name: String!): User
    }
    
    type Mutation {
        removeUser(email: String!, pwd: String!): String
        updatePwd(email: String!, pwd: String!, new_pwd: String!): String
        updateEmail(new_email: String!, code: String!): String
    }
`)

export const resolver = {
    users: async(args, context, info) => {
        return User.find();
    },
    user: async (args, context, info) => {
        const { name } = args;
        return User.findOne({name: name});
    },
    removeUser: async (args, context, info) => {
        const res = context.res;
        const {email, pwd} = args;
        const usr = await User.findOne({email: email});
        const token = context.req.cookies.token;
        if (token === undefined) {
            res.status(401);
            return "not logged in yet";
        } else {
            const decoded = jwt.verify(token, private_key);
            if (decoded.email !== email) {
                res.status(401);
                return "you can only remove your own account";
            } else if (!usr) {
                res.status(404);
                return USER_NOT_FOUND;
            } else if (!await bcrypt.compare(pwd, usr.pwd)) {
                res.status(401);
                return PASSWORD_NOT_MATCH;
            }
        }

        await User.deleteOne({email: email});
        context.res.clearCookie('token');
        context.res.clearCookie('refresh_token');
        return SUCCESS;
    },
    updatePwd: async (args, context, info) => {
        const res = context.res;
        const {email, pwd, new_pwd} = args;
        const usr = await User.findOne({email: email});
        const decoded = jwt.verify(context.req.cookies.token, private_key);
        if (decoded.email !== email) {
            res.status(401);
            return "you can only update your own account";
        } else if (!usr) {
            res.status(404);
            return USER_NOT_FOUND;
        } else if (!await bcrypt.compare(pwd, usr.pwd)) {
            res.status(401);
            return PASSWORD_NOT_MATCH;
        }

        const salt = await bcrypt.genSalt(10);
        await User.updateOne({email: email}, {pwd: await bcrypt.hash(new_pwd, salt)});
        return SUCCESS;
    },
    updateEmail: async (args, context, info) => {
        const res = context.res;
        const {new_email, code} = args;
        const decoded = jwt.verify(context.req.cookies.token, private_key);
        const usr = await User.findOne({email: decoded.email});
        const saved_code = await redisCli.hget(decoded.email, 'code');
        const code_type = await redisCli.hget(decoded.email, 'type');

        if (!usr) {
            res.status(404);
            return USER_NOT_FOUND;
        } else if (code_type !== 1 || code !== saved_code) {
            res.status(412);
            return "invalid code";
        }

        const token = jwt.sign(
            { _id: usr._id, name: usr.name, email: new_email }, private_key,
            { algorithm: 'HS512' , expiresIn: '1h'}
        );
        const refreshToken = jwt.sign(
            { _id: usr._id, name: usr.name, email: new_email }, refresh_priv_key,
            { algorithm: 'HS512' , expiresIn: '14d'}
        );
        const query = {email: decoded.email}
        await User.updateOne(query, { $set: {email: new_email}});
        await User.updateOne(query, { $set: {refresh_token: refreshToken}});
        res.cookie('token', token, { httpOnly: true });
        res.cookie('refresh_token', refreshToken, { httpOnly: true });
        return SUCCESS;
    }
};
