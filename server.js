import ejs from 'ejs';
import path from 'path';
import dotenv from 'dotenv';
import express from 'express';
import cookieParser from 'cookie-parser';
import { graphqlHTTP } from 'express-graphql';
import { verifyToken } from './modules/jwt/index.js';
import { schema, resolver } from './graphQL/schema.js';
import { auth_schema, auth_resolver } from "./graphQL/authSchema.js";

dotenv.config({
    path : process.env.NODE_ENV === "development" ? ".env.development" : ".env.production"
});


let app = express();
const __dirname = path.resolve();
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.engine('html', ejs.renderFile);

app.use(express.static('public'));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/graphauth', (req, res) => {
    return graphqlHTTP({
        schema: auth_schema,
        rootValue: auth_resolver,
        graphiql: true,
        context: { req, res }
    })(req, res);
});

app.use('/graphql', (req, res, next) => {
    verifyToken(req, res, next);
});
app.use('/graphql', (req, res) => {
    return graphqlHTTP({
        schema: schema,
        rootValue: resolver,
        graphiql: true,
        context: { req, res }
    })(req, res);
});

let server = app.listen(3000, function(){
    console.log("Express server has started on port 3000");
});
// var router = require('./router/main')(app, fs);
