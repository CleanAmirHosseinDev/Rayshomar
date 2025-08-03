const fs = require("fs");

const setElection = async (req, res, next) => {
  // const { NUM_OF_CANDIDATES, voters, NUM_OF_VOTES } = req.body;
  // const data = { NUM_OF_CANDIDATES, voters, NUM_OF_VOTES };

  const { NUM_OF_CANDIDATES, voters, NUM_OF_VOTES } = req.body

  const numOfCandidates = Number(NUM_OF_CANDIDATES);
  const data = { NUM_OF_CANDIDATES: numOfCandidates }

  req.election = {
    name: req.body.name,
    NUM_OF_CANDIDATES: numOfCandidates,
    voters: voters,
    NUM_OF_VOTES: NUM_OF_VOTES,
  };

  fs.writeFile(
    "../dev_api_foundry/TransferData/ElectionData/election.json",
    JSON.stringify(data, null, 2),
    (err) => {
      if (err) throw err;
      console.log("tVoting Data written to file");
    }
  );

  next();
};

module.exports = setElection;