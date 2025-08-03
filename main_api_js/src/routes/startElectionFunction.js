const express = require("express");
const router = express.Router();

const { handleStartElectionFunction } = require("../controllers/startElectionFunction.js")

router.route("/").post(handleStartElectionFunction);

module.exports = router;
