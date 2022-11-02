import jwt from 'jsonwebtoken';
import User from '../mongoose/schema/user.js';
import fs from "fs";

export const private_key = Buffer.from(
    fs.readFileSync('private.pem', 'utf8'), 'base64'
).toString('ascii');
export const public_key = Buffer.from(
    fs.readFileSync('public.pem', 'utf8'), 'base64'
).toString('ascii');
export const refresh_priv_key = Buffer.from(
    fs.readFileSync('refresh_private.pem', 'utf8'), 'base64'
).toString('ascii');
export const refresh_pub_key = Buffer.from(
    fs.readFileSync('refresh_public.pem', 'utf8'), 'base64'
).toString('ascii');

export const verifyToken = async (req, res, next) => {
    const authToken = req.get('Authorization');
    if (!authToken) {
        req.isAuth = false;
        return next();
    }
    const token = authToken.split(' ')[1];
    let verify;
    try {
        verify = jwt.verify(token, this.public_key);
    } catch (err) {
        req.isAuth = false;
        return next();
    }
    if (!verify._id) {
        req.isAuth = false;
        return next();
    }
    const user = await User.findOne({ _id: verify._id });
    if (!user) {
        req.isAuth = false;
        return next();
    }
    req.isAuth = true;
    req.userId = user._id;
    next();
};
