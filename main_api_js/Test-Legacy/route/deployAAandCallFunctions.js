const { deployAccountAbstraction, handleStartElection, handleSetForNewElection } = require("../controllers/deployAAandCallFunction");

const express = require("express");
const router = express.Router();

router.route("/").post(deployAccountAbstraction, handleStartElection, handleSetForNewElection);

module.exports = router;
