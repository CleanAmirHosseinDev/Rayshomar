require("dotenv").config();
const UserModel = require("../model/user");
const NewUserModel = require("../model/newUser")
const { UnauthenticatedError } = require("../errors/index");
const { BadRequestError, NotFoundError } = require("../errors/index");
const { StatusCodes } = require("http-status-codes");

// Old version register
const OldRegister = async (req, res) => {
  console.log(req.body);
  const user = await UserModel.create({ ...req.body });
  const token = user.createjwt();
  res.status(StatusCodes.CREATED).json({ user: { name: user.name }, token });
};

// New version register
const register = async (req, res) => {
  console.log(req.body);

  // Sending data to DB
  const user = await NewUserModel.create({ ...req.body });
  const token = user.createjwt();

  res.status(StatusCodes.CREATED).json({ user: { name: user.name }, token });
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new BadRequestError("provide email or password");
  }

  const user = await NewUserModel.findOne({ email });
  if (!user) {
    throw new UnauthenticatedError("Invalid credentials");
  }
  const correctPassword = await user.comparePass(password);
  console.log(correctPassword);
  if (!correctPassword) {
    throw new UnauthenticatedError("Invalid credentials");
  }
  const token = user.createjwt();
  res.status(StatusCodes.OK).json({ user: { name: user.name }, token });
};


const addUserOp = async (req, res) => {
  const { publicKey, userOp } = req.body
  console.log(typeof (userOp), userOp);
  const user = await NewUserModel.findOneAndUpdate({ publicKey: publicKey }, { userOperation: userOp })
  if (!user) {
    throw new NotFoundError("User not found, the user have not register yet.");
  }
  res.status(StatusCodes.OK).send('user Operation saved to Datebase successfully.')


}
module.exports = { login, OldRegister, register, addUserOp };
