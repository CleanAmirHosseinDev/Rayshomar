const express = require("express");
const router = express.Router();

const { handleDeployPaymasterContract } = require("../controllers/deployPaymasterContract.js")

router.route("/").post(handleDeployPaymasterContract);

module.exports = router;
