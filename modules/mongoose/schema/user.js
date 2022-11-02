import mongoose from "../model.js";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
    name: String,
    pwd: String,
    refresh_token: String,
    c_date: { type: Number, default: Number(Date.now()) },
});

userSchema.pre('save', async function () {
    const salt = await bcrypt.genSalt(10);
    this.pwd = await bcrypt.hash(this.pwd, salt);
})

userSchema.post('save', async function(docs, next){
    if (docs.c_date !== null && docs.c_date !== undefined) {
        const date = new Date(docs.c_date);
        if (date.toString() === "Invalid Date") {
            docs.c_date = -1;
        } else {
            docs.c_date = date.getTime();
        }
    }
    next();
})



const User = mongoose.model("User", userSchema);

export default User;
