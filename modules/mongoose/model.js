import { mongoose } from "mongoose";
const URI = process.env.MONGO_URI || "localhost";
const DB = process.env.MONGO_DB || "mongoose";

const db = mongoose.connection;
db.on("error", console.error);
db.once("open", function () {
    console.log("Connected to mongod server");
});

mongoose.connect(`mongodb://${URI}/${DB}`, { useNewUrlParser: true });

export default mongoose;