const { deployPaymaster, addStake, depositPaymaster } = require("../controllers/paymaster");

const express = require("express");
const router = express.Router();

router.route("/").post(deployPaymaster);

module.exports = router;
