const fs = require("fs");

const setAccountAbstraction = async (req, res, next) => {
    const { tVotingAddress, voters } = req.aa;

    voters.forEach(async (voterAddress) => {

        const data = {
            _entryPoint: '?',
            _voting: tVotingAddress,
            _rayshomarAddress: voterAddress

        }
        fs.writeFile(
            `../dev_api_foundry/aa_data/aa${smartAccountAddress}.json`,
            JSON.stringify(data, null, 2),
            (err) => {
                if (err) throw err;
                console.log("Data written to file");
            }
        );
    });

    next();
};

module.exports = setAccountAbstraction;
