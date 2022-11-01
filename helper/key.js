import fs from "fs";

export const private_key = Buffer.from(
    fs.readFileSync('private.pem', 'utf8'), 'base64'
).toString('ascii');
export const public_key = Buffer.from(
    fs.readFileSync('public.pem', 'utf8'), 'base64'
).toString('ascii');
