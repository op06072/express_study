import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { buildSchema } from "graphql";
import User from '../modules/mongoose/schema/user.js';
import { private_key, refresh_priv_key } from '../modules/jwt/index.js';

const USER_NOT_FOUND = 'user not found';
const PASSWORD_NOT_MATCH = 'password not match';
const SUCCESS = 'success';

export const schema = buildSchema(`
    
    type User {
        name: String!
        c_date: Float
        DATE: [Float]
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

export const resolver = {
    users: async(args, context, info) => {
        return User.find();
    },
    user: async (args, context, info) => {
        const { name } = args;
        return User.findOne({name: name});
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

        const query = {name: name};

        const usr = await User.findOne(query);
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
        const refreshToken = jwt.sign(
            { _id: usr._id, name: name }, refresh_priv_key, { algorithm: 'HS256' , expiresIn: '14d'}
        );
        await User.updateOne(query, { $set: {refresh_token: refreshToken}});
        context.res.cookie('token', token, { httpOnly: true });
        context.res.cookie('refresh_token', refreshToken, { httpOnly: true });
        return SUCCESS;
    }
};
