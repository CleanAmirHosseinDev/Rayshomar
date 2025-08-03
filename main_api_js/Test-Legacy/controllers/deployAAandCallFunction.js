const fs = require("fs");
require("dotenv").config();

const { exec } = require("child_process");
const NewUserModel = require('../model/newUser')
const ElectionModel = require("../model/election");
const { StatusCodes } = require("http-status-codes");
const { BadRequestError, NotFoundError } = require("../errors/index");
const { ethers, JsonRpcProvider } = require('ethers')

// deploy Account Abstraction Account for each voter and call the setElection function from TVoting contract

const deployAccountAbstraction = async (req, res, next) => {
    console.log('Deploying AA...');
    const { tVotingAddress, voters } = req.aa;

    try {
        // Sequentially deploy Account Abstraction for each voter
        for (const voterEmail of voters) {
            try {
                const voterAccountAddress = await new Promise((resolve, reject) => {
                    exec(`cd ../dev_api_foundry && forge script script/DeployVoterAccount.s.sol:DeployVoterAccount --rpc-url ${process.env.SEPOLIA_URL} --private-key ${process.env.PRIVATE_KEY} --broadcast`,
                        (error, stdout, stderr) => {
                            if (error) {
                                console.error(`exec error: ${error}`);
                                return reject(`Error deploying contract: ${error.message}`);
                            }

                            if (stderr) {
                                console.error(`stderr: ${stderr}`);
                            }

                            const addressMatch = stdout.match(/Deployed contract address:\s*(0x[a-fA-F0-9]{40})/);
                            const voterAccountAddress = addressMatch ? addressMatch[1] : null;

                            if (voterAccountAddress) {
                                resolve(voterAccountAddress);
                            } else {
                                reject("Contract Account Address not found in output");
                            }
                        }
                    );
                });

                // Save the address to the database
                const user = await NewUserModel.findOneAndUpdate(
                    { email: voterEmail },
                    { accountAbstractionAddress: voterAccountAddress },
                    { new: true }  // Return the updated document
                );

                if (!user) {
                    throw new Error("User not found, the user has not registered yet.");
                }

                console.log(`Account Abstraction Address for ${voterEmail} saved to Database successfully.`);
            } catch (dbError) {
                console.error(`Error saving AA address to database for ${voterEmail}: ${dbError.message}`);
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(`Error saving AA address for ${voterEmail}: ${dbError.message}`);
            }
        }

        // Store all account abstraction addresses in ElectionModel
        try {
            let votersAddress = [];
            let votersPublicKeyArray = [];
            for (const voterEmail of voters) {
                const user = await NewUserModel.findOne({ email: voterEmail });
                if (user) {
                    votersAddress.push(user.accountAbstractionAddress);
                    votersPublicKeyArray.push(user.publicKey)
                }
            }
            // const users = await NewUserModel.find({});
            // const accountAbstractionAddresses = users.map(user => user.accountAbstractionAddress);
            const { name } = req.election;
            const election = await ElectionModel.findOne({ name });

            if (!election) {
                throw new Error('Election not found');
            }
            console.log('all the aas', votersAddress);
            election.votersAA = votersAddress;
            election.votersPublicKey = votersPublicKeyArray;
            await election.save();
            console.log('Account Abstraction Addresses stored successfully.');
        } catch (error) {
            console.error('Error storing Account Abstraction Addresses:', error);
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(`Error storing Account Abstraction Addresses: ${error.message}`);
        }

        next();
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(`Error in deployAccountAbstraction: ${error.message}`);
    }
};

const handleStartElection = async (req, res, next) => {
    console.log('Executing startElection...');

    const { tVotingAddress, voters } = req.aa;
    // call startElection function from TVoting contract

    /* startElection argument no.1 */
    let votersAddress = [];
    try {
        for (const voterEmail of voters) {
            const user = await NewUserModel.findOne({ email: voterEmail });
            if (user) {
                votersAddress.push(user.accountAbstractionAddress);
            }
        }

    } catch (error) {
        console.log('error fetching users account abstraction address');
    }
    /* startElection argument no.2 */
    const { NUM_OF_VOTES } = req.election


    const provider = new JsonRpcProvider(process.env.SEPOLIA_URL)
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider)
    const abi = ['function startElection( address[] memory _voters, uint256[] memory _numOfVotes) public']

    const contract = new ethers.Contract(tVotingAddress, abi, wallet);
    console.log('sending transaction to startElection...');

    async function startElection() {
        try {
            let nonce = await provider.getTransactionCount(wallet.address);
            console.log('nonce:', nonce);
            console.log(NUM_OF_VOTES);
            const tx = await contract.startElection(votersAddress, NUM_OF_VOTES, {
                nonce: nonce
            });

            // Wait for the transaction to be mined
            const receipt = await tx.wait();
            console.log('Transaction to startElection successful with hash:', receipt.hash);
            res.status(StatusCodes.OK).send('Start Election Function called')

        } catch (error) {
            console.error('Error calling startElection:', error);
            res.status(StatusCodes.NOT_ACCEPTABLE).json({ error })
        } finally {
            next()
        }
    }

    startElection();
    console.log('end of sending transaction to startElection');
}


const handleSetForNewElection = async (req, res, next) => {
    console.log('Executing handleSetForNewElection...');

    // call the setForNewElection function from voterAccount.sol

    /* setForNewElection argument no.2*/
    const { tVotingAddress, voters } = req.aa


    const provider = new JsonRpcProvider(process.env.SEPOLIA_URL)
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider)
    const abi = ['function setForNewElection( address _rayshomarAddress, address _tVoting) external']

    let nonce = await provider.getTransactionCount(wallet.address);

    try {
        for (let i = 0; i < voters.length; i++) {
            console.log(nonce);
            const voterEmail = voters[i];
            const user = await NewUserModel.find({ email: voterEmail })

            /* setForNewElection argument no.1*/
            const rayshomarAddress = user[0].publicKey
            const voterAccountAddress = user[0].accountAbstractionAddress



            const contract = new ethers.Contract(voterAccountAddress, abi, wallet);

            console.log(`sending transaction ${i + 1} to setForNewElection...`);


            try {

                const tx = await contract.setForNewElection(rayshomarAddress, tVotingAddress, {
                    nonce: nonce++
                });

                // Wait for the transaction to be mined
                const receipt = await tx.wait();
                console.log('Transaction to setForNewElection successful with hash:', receipt.hash);
                // res.status(StatusCodes.OK).send('SetForNewElection Function called')

            } catch (error) {
                console.error('Error calling SetForNewElection:', error);
                res.status(StatusCodes.NOT_ACCEPTABLE).json({ error })
            }
        }

    } catch (error) {
        console.log(error);
    } finally {
        next()
    }

}


module.exports = { deployAccountAbstraction, handleStartElection, handleSetForNewElection };