const express = require('express');
const router = express.Router();

// I will create this controller file in the next step
const {
    getAllElections,
    getElection,
    castVote
} = require('../controllers/electionsController');

router.route('/').get(getAllElections);
router.route('/:id').get(getElection);
router.route('/:id/vote').post(castVote);

module.exports = router;
