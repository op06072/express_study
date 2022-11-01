import mongoose from "../model.js";

const userSchema = new mongoose.Schema({
    name: String,
    c_date: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);

export default User;
