import jwt from 'jsonwebtoken';
import User from '../mongoose/schema/user.js';
import Pwd from '../mongoose/schema/pwd.js';

import { public_key } from './key.js';

export const verifyToken = async (req, res, next) => {
    const authToken = req.get('Authorization');
    if (!authToken) {
        req.isAuth = false;
        return next();
    }
    const token = authToken.split(' ')[1];
    let verify;
    try {
        verify = jwt.verify(token, public_key);
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
