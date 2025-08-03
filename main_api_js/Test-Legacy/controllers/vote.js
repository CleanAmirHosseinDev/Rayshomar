const VoteModel = require("../model/vote");
const ElectionModel = require("../model/election");
const { StatusCodes } = require("http-status-codes");
const { BadRequestError, NotFoundError } = require("../errors/index");
const { ethers } = require("ethers");
const jwt = require("jsonwebtoken");

// contract ABI
// const contractAbiJson = require("../../dev_api_foundry/out/TVoting.sol/TVoting.json");
// const abi = contractAbiJson.abi;

// RPC Provider
// const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
// const provider = new ethers.providers.JsonRpcProvider();
// const provider = ethers.getDefaultProvider("http://localhost:8545");

// Get Election List
const getElections = async (req, res) => {
  // Accessing publicKey

  const authHeader = req.headers.authorization;
  const token = authHeader.split(" ")[1];
  const decode = jwt.verify(token, process.env.JWT_SECRET);
  const { publicKey, email } = decode;
  console.log(publicKey);

  try {
    const elections = await ElectionModel.find({ voters: email });
    console.log(elections.length);
    if (elections.length === 0) {
      res
        .status(StatusCodes.NOT_FOUND)
        .json({ error: "You have no access to any election" });
      return;
    }
    const electionDetails = elections.map((election) => ({
      name: election.name,
      contractAddress: election.contractAddress,
    }));
    res.status(StatusCodes.OK).json(electionDetails);
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: error.message });
  }
};
// Get Specific Election
const getSingleElection = async (req, res) => {
  const { contractAddress: contractId } = req.params;
  const election = await ElectionModel.findOne({ contractAddress: contractId });
  console.log(election);
  if (!election) {
    throw new NotFoundError("there is no election with this contract address");
  }
  res.status(StatusCodes.OK).json({ election });
};


// Transaction Function
// async function castVoteOnBlockchain(privateKey, contractAddress, votes) {
//   const wallet = new ethers.Wallet(privateKey, provider);
//   const contract = new ethers.Contract(contractAddress, abi, wallet);

//   try {
//     const tx = await contract.vote(votes);
//     console.log(`Transaction hash: ${tx.hash}`);
//     await tx.wait(); // Wait for the transaction to be mined
//     console.log("Vote cast successfully on the blockchain!");
//     return { success: true, txHash: tx.hash };
//   } catch (error) {
//     console.error(`Error casting vote on the blockchain: ${error}`);
//     return { success: false, error: error.message };
//   }
// }

// Post Vote
const castVote = async (req, res) => {
  req.body.email = req.user.email;
  const { contractAddress: contractId } = req.params;
  req.body.contractAddress = contractId;

  // Checks in this user already voted or not
  const votedElection = await VoteModel.find({
    email: req.user.email,
    contractAddress: contractId,
  });
  console.log(votedElection.length);
  if (votedElection.length === 1) {
    throw new BadRequestError("You have already voted in this election");
  }

  const election = await ElectionModel.findOne({ contractAddress: contractId });
  const { NUM_OF_CANDIDATES, NUM_OF_VOTES } = election;

  const { votes } = req.body;
  console.log(votes, NUM_OF_CANDIDATES, NUM_OF_VOTES);

  // Cast vote on Blockchain
  // const result = await castVoteOnBlockchain(privateKey, contractId, arrayVote);
  // console.log(result);
  // if (!result.success) {
  //   throw new BadRequestError(`Blockchain transaction failed: ${result.error}`);
  // }
  const stringVote = votes.join();
  const entry = {
    vote: stringVote,
    email: req.body.email,
    contractAddress: contractId,
  };
  // sending vote to db
  await VoteModel.create(entry);

  res.status(StatusCodes.OK).send(`vote casted successfully on db.`);
};

module.exports = { castVote, getElections, getSingleElection };
