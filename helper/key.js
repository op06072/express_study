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
