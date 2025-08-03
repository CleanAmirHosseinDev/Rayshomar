const express = require("express")
const router = express.Router();

const { handleDeployVoterAccounts } = require('../controllers/deployVoterAccountContract');

router.route("/").post(handleDeployVoterAccounts);

module.exports = router;