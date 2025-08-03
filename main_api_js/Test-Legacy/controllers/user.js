const jwt = require("jsonwebtoken");
const NewUserModel = require("../model/newUser")
const { StatusCodes } = require('http-status-codes')
const { BadRequestError, NotFoundError } = require("../errors/index");


const getSingleUser = async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new BadRequestError("Authorization token missing or malformed");
    }
    const token = authHeader.split(" ")[1];

    const decode = jwt.verify(token, process.env.JWT_SECRET);
    const { email } = decode

    const user = await NewUserModel.findOne({ email: email })
    if (!user) {
        throw new NotFoundError("User not found");
    }

    const { encryptedJson, accountAbstractionAddress, publicKey } = user
    res.status(StatusCodes.OK).json({ encryptedJson, accountAbstractionAddress, publicKey, email })


}


module.exports = getSingleUser