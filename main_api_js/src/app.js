require("express-async-errors");
const express = require("express");
const path = require("path");
const app = express();

//connect router
const deployElectionContractRouter = require("./routes/deployElectionContract");
const deployVoterAccountsRouter = require("./routes/deployVoterAccountContract");
const startElectionFunctionRouter = require("./routes/startElectionFunction");
const setForNewElectionFunctionRouter = require("./routes/setForNewElectionFunction");
const deployPaymasterContractRouter = require("./routes/deployPaymasterContract");

//connect middlewares
const electionContractDataFile = require("./middleware/createElectionContractDataFile");
const paymasterContractDataFile = require("./middleware/createPaymasterContractDataFile");

//middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

app.use(
    "/StartElection",
    electionContractDataFile,
    deployElectionContractRouter,
    startElectionFunctionRouter,
    setForNewElectionFunctionRouter,
    paymasterContractDataFile,
    deployPaymasterContractRouter

);
app.use("/deployVoterAccounts", deployVoterAccountsRouter);

const port = 5000;
const start = async () => {
    try {
        app.listen(port, console.log(`server listening on port ${port}...`));
    } catch (error) {
        console.log(error);
    }
};

start();

module.exports = app;