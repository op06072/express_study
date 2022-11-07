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
    const token = req.cookies.token;
    if (!token) {
        req.isAuth = false;
        res.status(412).json({message: "not logged in yet"});
        return
    }
    let verify;
    try {
        verify = jwt.verify(token, private_key);
    } catch (err) {
        if (err === jwt.TokenExpiredError || err.name === 'TokenExpiredError') {
            try {
                const refresh_verify = jwt.verify(
                    req.cookies.refresh_token, refresh_priv_key
                );
                const token = jwt.sign(
                    {
                        _id: refresh_verify._id,
                        name: refresh_verify.name,
                        email: refresh_verify.email
                    }, private_key,
                    { algorithm: 'HS512' , expiresIn: '1h'}
                );
                res.cookie('token', token, { httpOnly: true });
                req.cookies.token = token;
                req.isAuth = true;
                return next();
            } catch (error) {
                req.isAuth = false;
                res.status(412).json({error: 'token expired'});
                return
            }
        } else {
            req.isAuth = false;
            res.status(412).json({error: err});
            return
        }
    }
    if (!verify._id) {
        req.isAuth = false;
        res.status(412).json({error: 'no _id in token'});
        return
    }
    const user = await User.findOne({ _id: verify._id });
    if (!user) {
        req.isAuth = false;
        res.status(404).json({ error: 'user not found' });
        return
    }
    req.isAuth = true;
    req.userId = user._id;
    next();
};
