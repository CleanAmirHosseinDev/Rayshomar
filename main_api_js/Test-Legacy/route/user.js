const getSingleUser = require('../controllers/user')
const express = require("express");
const router = express.Router();

router.route("/").get(getSingleUser);
router.route("/:password").post(getSingleUser);

module.exports = router;
