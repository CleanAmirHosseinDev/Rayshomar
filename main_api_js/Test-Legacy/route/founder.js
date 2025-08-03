const { deployContract } = require("../controllers/founder");

const express = require("express");
const router = express.Router();

router.route("/").post(deployContract);

module.exports = router;
