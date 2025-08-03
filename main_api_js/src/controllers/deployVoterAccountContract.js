require("dotenv").config();

const { exec } = require("child_process");
const { StatusCodes } = require("http-status-codes");

{/**Deploys Number of VoterAccount Contract Based on Number of Voters */ }
const handleDeployVoterAccounts = async (req, res, next) => {
    console.log("Deploying voter Accounts...");

    const { voterCount } = req.body;
    const voterAccounts = [];

    // Step 1: Deploy AA contract and store for each voter
    for (let i = 0; i < voterCount; i++) {
        try {
            const voterAccountAddress = await new Promise((resolve, reject) => {
                exec(
                    `cd ../dev_api_foundry && forge script script/DeployVoterAccount.s.sol:DeployVoterAccount --rpc-url ${process.env.SEPOLIA_URL} --private-key ${process.env.PRIVATE_KEY} --broadcast`,
                    (error, stdout, stderr) => {
                        if (error) {
                            return reject(new Error(`Forge exec error: ${error.message}`));
                        }

                        if (stderr) {
                            console.warn(`Forge stderr: ${stderr}`);
                        }

                        const addressMatch = stdout.match(/Deployed contract address:\s*(0x[a-fA-F0-9]{40})/);
                        if (addressMatch && addressMatch[1]) {
                            resolve(addressMatch[1]);
                        } else {
                            reject(new Error("Contract Account Address not found in forge output"));
                        }
                    }
                );
            });
            // Step 2: Store Addresses
            console.log(`Voter Account No${i}: ${voterAccountAddress}`);
            voterAccounts.push(voterAccountAddress);

        } catch (err) {
            console.error("Error in Deploying Voter Accounts:", err);
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                error: "Error Deploying Voter Accounts",
                details: err.message
            });
        }
    }
    return res.status(StatusCodes.OK).json({
        voterAccounts: voterAccounts
    });


    // // Step 3: Save all AAs to election
    // try {
    //     const votersAddress = [];
    //     const votersPublicKeyArray = [];

    //     for (const voterEmail of voters) {
    //         const user = await NewUserModel.findOne({ email: voterEmail });
    //         if (user?.accountAbstractionAddress) {
    //             votersAddress.push(user.accountAbstractionAddress);
    //             votersPublicKeyArray.push(user.publicKey);
    //         } else {
    //             console.warn(`Warning: Missing address or public key for ${voterEmail}`);
    //         }
    //     }

    //     const { name } = req.election;
    //     const election = await ElectionModel.findOne({ name });

    //     if (!election) {
    //         return res.status(StatusCodes.NOT_FOUND).json({ error: "Election not found" });
    //     }

    //     election.votersAA = votersAddress;
    //     election.votersPublicKey = votersPublicKeyArray;
    //     await election.save();

    //     console.log("✅ All voter AAs saved to Election model.");
    //     next();

    // } catch (err) {
    //     console.error("❌ Error saving AAs to election:", err);
    //     return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    //         error: "Error saving Account Abstractions to election",
    //         details: err.message
    //     });
    // }
}

module.exports = { handleDeployVoterAccounts }