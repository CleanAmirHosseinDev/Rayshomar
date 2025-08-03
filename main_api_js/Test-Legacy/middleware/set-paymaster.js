const fs = require("fs");
const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');
const NewUserModel = require('../model/newUser')
const ElectionModel = require('../model/election')
const { BadRequestError, NotFoundError } = require("../errors/index");



const setPaymaster = async (req, res, next) => {

    const { voters } = req.aa
    let votersAddress = [];

    try {
        for (const voterEmail of voters) {
            const user = await NewUserModel.findOne({ email: voterEmail });
            if (user) {
                votersAddress.push(user.publicKey);
            }
        }
        console.log('in set-paymaster: votersAddress:', votersAddress);
        // Generate Merkle tree root
        const leaves = votersAddress.map(x => keccak256(x))
        console.log('leaves', leaves);
        const merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true })
        console.log('merkleTree', merkleTree);

        const root = merkleTree.getRoot().toString('hex')
        console.log('root', root);
        // generate proof for each user
        for (const voterPublicKey of votersAddress) {

            const leaf = keccak256(voterPublicKey)
            console.log('leaf', leaf);
            const merkleProof = merkleTree.getHexProof(leaf);
            console.log('merke proof', merkleProof);
            const user = await NewUserModel.findOneAndUpdate({ publicKey: voterPublicKey }, { merkle_proof: merkleProof })
            if (!user) {
                throw new NotFoundError('user for updating merkle proof does not exists!')
            }
        }

        // const rootWithPrefix = `0x${root}`;

        // saving merkle tree of a election into DB



        const data = {
            Entrypoint: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
            MerkleRootHash: root
        }

        fs.writeFile(
            "../dev_api_foundry/TransferData/PaymasterData/paymaster.json",
            JSON.stringify(data, null, 2),
            (err) => {
                if (err) throw err;
                console.log("Data paymaster written to file");
                next()
            }
        );

    } catch (error) {
        console.error('Error in setPaymaster middleware:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send('Error setting paymaster data');
    }



};

module.exports = setPaymaster;