const express = require("express");
const router = express.Router();

const { login, OldRegister, register, addUserOp } = require("../controllers/auth");

router.route("/login").post(login);
router.route("/OldRegister").post(OldRegister);
router.route("/register").post(register);
router.route("/userOp").post(addUserOp)

module.exports = router;
