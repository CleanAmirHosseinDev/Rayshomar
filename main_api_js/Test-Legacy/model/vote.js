const mongoose = require("mongoose");

const voteModel = mongoose.Schema(
  {
    vote: {
      type: String,
      // enum: ["candidate1", "candidate2", "candidate3", ...]
      default: "none",
    },
    email: {
      type: String,
    },
    contractAddress: {
      type: String,
      required: [true, "contract address must be provided"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("vote", voteModel);
