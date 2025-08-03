const express = require("express");
const router = express.Router();

const { handleSetForNewElectionFunction } = require("../controllers/setForNewElectionFunction.js")

router.route("/").post(handleSetForNewElectionFunction);

module.exports = router;
