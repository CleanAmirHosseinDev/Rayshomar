const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const UserOpSchema = new mongoose.Schema({
  sender: String,
  nonce: Number,
  initCode: String,
  callData: String,
  accountGasLimits: String,
  preVerificationGas: String,
  gasFees: String,
  paymasterAndData: String,
  signature: String
});

const NewUserModel = new mongoose.Schema({
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
    required: [true, "must provide the public key"]
  },
  encryptedJson: {
    type: String
  },
  accountAbstractionAddress: {
    type: String,
    default: 'none'
  },
  userOperation: {
    type: UserOpSchema,
    required: [false]
  },
  NUM_OF_VOTES: {
    type: Number,
    required: [false],
  },
  merkle_proof: {
    type: Array,
    default: 'not prove yet'
  }

});

NewUserModel.pre("save", async function () {
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

NewUserModel.methods.createjwt = function () {
  return jwt.sign(
    { userId: this._id, email: this.email, publicKey: this.publicKey },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_LIFETIME }
  );
};


NewUserModel.methods.comparePass = async function (candidatePassword) {
  const isMatch = await bcrypt.compare(candidatePassword, this.password);
  return isMatch;
};

module.exports = mongoose.model("NewUser", NewUserModel);
