import ejs from 'ejs';
import path from 'path';
import dotenv from 'dotenv';
import express from 'express';
import { graphqlHTTP } from 'express-graphql';
import { verifyToken } from './helper/jwt.js';
import { schema, resolver } from './schema.js';

dotenv.config({
	path : process.env.NODE_ENV === "development" ? ".env.development" : ".env.production"
});

var app = express();
const __dirname = path.resolve();
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.engine('html', ejs.renderFile);

var server = app.listen(3000, function(){
    console.log("Express server has started on port 3000");
});
app.use(express.static('public'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/graphql', (req, res) => {
    return graphqlHTTP({
        schema: schema,
        rootValue: resolver,
        graphiql: true,
        context: { req, res }
    })(req, res);
});

app.use(verifyToken);

//var router = require('./router/main')(app, fs);
