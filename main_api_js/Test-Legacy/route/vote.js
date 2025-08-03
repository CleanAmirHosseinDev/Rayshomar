const express = require("express");
const router = express.Router();

const {
  castVote,
  getElections,
  getSingleElection
} = require("../controllers/vote");

router.route("/").get(getElections);
router.route("/:contractAddress").get(getSingleElection).post(castVote);

module.exports = router;
