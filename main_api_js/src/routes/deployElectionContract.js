const express = require("express");
const router = express.Router();

const { handleDeployElectionContract } = require("../controllers/deployElectionContract.js")

router.route("/").post(handleDeployElectionContract);

module.exports = router;
