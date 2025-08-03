const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
require("dotenv");

const UserModel = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "must provide a name"],
  },
  email: {
    type: String,
    required: [true, "Please provide an email"],
    match: [
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      "email is not valid",
    ],
    unique: true,
  },
  password: {
    type: String,
    required: [true, "must provide an password"],
    minlength: 6,
  },
  publicKey: {
    type: String,
    required: [true, "must provide the public key"],
    match: [/^0x[a-fA-F0-9]{40}$/g, "public key is not valid"],
  },
  userOperation: {
    type: String,
    default: 'none'
  }
});

UserModel.pre("save", async function () {
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

UserModel.methods.createjwt = function () {
  return jwt.sign(
    { userId: this._id, email: this.email, publicKey: this.publicKey },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_LIFETIME }
  );
};

UserModel.methods.comparePass = async function (candidatePassword) {
  const isMatch = await bcrypt.compare(candidatePassword, this.password);
  return isMatch;
};

module.exports = mongoose.model("User", UserModel);
