const mongoose = require("mongoose");

const ElectionModel = mongoose.Schema({
  name: {
    type: String,
    required: [true, "You should provide the election name"],
  },
  NUM_OF_CANDIDATES: {
    type: Number,
    required: [true, "must provide the number of candidates"],
  },
  voters: {
    type: Array,
    required: [true, "must provide the voters email list"],
  },
  NUM_OF_VOTES: {
    type: Array,
    required: [true, "must provide the number of votes for each voter"],
  },
  contractAddress: {
    type: String,
    default: "none",
  },
  payMasterAddress: {
    type: String,
  },
  entryPointAddress: {
    type: String,
    required: [false]
  },
  votersAA: {
    type: Array,
    required: [false]
  }
});

module.exports = mongoose.model("election", ElectionModel);
