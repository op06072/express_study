import express from 'express';
import bodyParser from 'body-parser';
import ejs from 'ejs';
import path from 'path';
import { graphqlHTTP } from 'express-graphql';
import { verifyToken } from './helper/jwt.js';
import { schema, resolver } from './schema.js';

var app = express();
const __dirname = path.resolve();
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.engine('html', ejs.renderFile);

var server = app.listen(3000, function(){
    console.log("Express server has started on port 3000");
});
app.use(express.static('public'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded());

app.use('/graphql', async (req, res) => {
    var result = await graphqlHTTP({
        schema: schema,
        rootValue: resolver,
        graphiql: true,
        context: { req, res }
    })(req, res);
    console.log(result);
    return result;
});

app.use(verifyToken);

//var router = require('./router/main')(app, fs);
