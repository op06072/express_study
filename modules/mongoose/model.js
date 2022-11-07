import mongoose from "mongoose";
import fs from "fs";

const secret_path = process.env.SECRET_PATH
console.log(secret_path);
const USERNAME = fs.readFileSync(secret_path+'id', 'utf8').trimStart().trimEnd() || 'root';
const PASSWORD = fs.readFileSync(secret_path+'pw', 'utf8').trimStart().trimEnd() || 'root';
const URI = process.env.MONGO_URI || "localhost";
const DB = process.env.MONGO_DB || "mongoose";

const db = mongoose.connection;
db.on("error", console.error);
db.once("open", function () {
    console.log("Connected to mongod server");
});

mongoose.connect(`mongodb://${USERNAME}:${PASSWORD}@${URI}/${DB}?authSource=admin`, { useNewUrlParser: true });

export default mongoose;