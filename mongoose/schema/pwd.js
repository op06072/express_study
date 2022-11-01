import mongoose from "../model.js";
import bcrypt from "bcrypt";

const pwdSchema = new mongoose.Schema({
    name: String,
    pwd: String,
});

pwdSchema.pre('save', async function () {
    const salt = await bcrypt.genSalt(10);
    this.pwd = await bcrypt.hash(this.pwd, salt);
})

const Pwd = mongoose.model("Pwd", pwdSchema);

export default Pwd;