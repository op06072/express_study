import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { buildSchema } from "graphql";
import User from './mongoose/schema/user.js';
import { private_key } from './helper/key.js';

const USER_NOT_FOUND = 'user not found';
const PASSWORD_NOT_MATCH = 'password not match';
const SUCCESS = 'success';

export var schema = buildSchema(`
    
    type User {
        name: String!
        pwd: String
        c_date: Int
    }
    
    type Query {
        users: [User]
        user(name: String!): User
        login(name: String!, pwd: String!): String
    }
    
    type Mutation {
        createUser(name: String!, pwd: String!): String
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

        if(await User.findOne({name: name})) {
            return "User already exists";
        }

        await new User({name: name, pwd: pwd}).save();
        return SUCCESS;
    },
    login: async (args, context, info) => {
        const {name, pwd} = args;

        const usr = await User.findOne({name : name});
        if (!usr) {
            return USER_NOT_FOUND;
        }
        const isCorrectPassword = await bcrypt.compare(pwd, usr.pwd);
        if (!isCorrectPassword) {
            return PASSWORD_NOT_MATCH;
        }
        const token = jwt.sign(
            { _id: usr._id, name: name }, private_key, { algorithm: 'HS256' , expiresIn: '1h'}
        );
        context.res.set('Set-Cookie', `token=${token};`);
        return SUCCESS;
    },
};
