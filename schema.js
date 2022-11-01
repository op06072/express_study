import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { buildSchema } from "graphql";
import User from './mongoose/schema/user.js';
import Pwd from './mongoose/schema/pwd.js';

import { private_key } from './helper/key.js';

const TOKEN_EXPIRED = -4;
const TOKEN_INVALID = -3;
const USER_NOT_FOUND = -2;
const PASSWORD_NOT_MATCH = -1;

export var schema = buildSchema(`
    
    type User {
        name: String!
        c_date: String
    }
    
    type Pwd {
        name: String!
        pwd: String!
    }
    
    type ReturnType {
        user: User
        code: Int
    }
    
    type Query {
        users: [User]
        user(name: String!): User
        login(name: String!, pwd: String!): ReturnType
        verify(token: String!): ReturnType
    }
    
    type Mutation {
        createUser(name: String!, pwd: String!): User
    }
`);

export var resolver = {
    users: async(args, context, info) => {
        return await User.find();
    },
    user: async (args, context, info) => {
        const { name } = args;
        return await User.findOne({name: name});
    },
    createUser: async (args, context, info) => {
        const {name, pwd} = args;

        if(await User.findOne({name: name})) throw "ID is existed";

        await new Pwd({name: name, pwd: pwd}).save();
        return await new User({name: name}).save();
    },
    login: async (args, context, info) => {
        const {name, pwd} = args;

        const user = await User.findOne({name : name});
        if (!user) {
            return {
                code: USER_NOT_FOUND
            }
        }
        const pswd = await Pwd.findOne({name : name});
        const isCorrectPassword = await bcrypt.compare(pwd, pswd.pwd);
        if (!isCorrectPassword) {
            return {
                code: PASSWORD_NOT_MATCH
            }
        }
        const token = jwt.sign({ _id: user._id, name: name }, private_key, { algorithm: 'HS256' });
        context.res.set('cookie', `token=${token};`);
        return {
            user: user
        }
    },
    verify: async (args, context, info) => {
        const {token} = args;

        let verify;
        try {
            verify = jwt.verify(token, private_key);
        } catch (err) {
            if (err.message === 'jwt expired') {
                console.log('expired token');
                return {
                    code: TOKEN_EXPIRED
                }
            } else if (err.message === 'invalid token') {
                console.log("invalid token");
                return {
                    code: TOKEN_INVALID
                }
            } else {
                console.log("invalid token");
                return {
                    code: TOKEN_INVALID
                }
            }
        }
        return {
            user: verify
        }
    }
};
