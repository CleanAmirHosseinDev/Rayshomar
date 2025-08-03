require('dotenv').config();
require("express-async-errors");
const path = require("path");
const express = require("express");
const app = express();

//connectDB
const connectDB = require("../Test-Legacy/db/connect");

//connect router
const authRouter = require("../Test-Legacy/route/auth");
const voteRouter = require("../Test-Legacy/route/vote");
const founderRoute = require("../Test-Legacy/route/founder");
const AARoute = require("../Test-Legacy/route/deployAAandCallFunctions");
const paymasterRoute = require("../Test-Legacy/route/paymaster");
const userRoute = require("../Test-Legacy/route/user");

//connect middlewares
const authenticateUser = require("../Test-Legacy/middleware/authentication");
const setElection = require("../Test-Legacy/middleware/set-election");
const setAccountAbstraction = require("../Test-Legacy/middleware/set-accountAbstraction");
const setPaymaster = require("../Test-Legacy/middleware/set-paymaster");

//error handler
const notFoundMiddleware = require("../Test-Legacy/middleware/not-found");
const errorHandlerMiddleware = require("../Test-Legacy/middleware/error-handler");

//middleware
app.use(express.static(path.join(__dirname, "../Test-Legacy/public")));

app.get("/register", (req, res) => {
    res.sendFile(path.join(__dirname, "../Test-Legacy/public/register.html"));
});
app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "../Test-Legacy/public/login.html"));
});
app.get("/getRegisteredElections", (req, res) => {
    res.sendFile(path.join(__dirname, "../Test-Legacy/public/getRegisteredElections.html"));
});
app.get("/castVote", (req, res) => {
    res.sendFile(path.join(__dirname, "../Test-Legacy/public/castVote.html"));
});
app.get("/create-election", (req, res) => {
    res.sendFile(path.join(__dirname, "../Test-Legacy/public/create-election.html"));
});
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../Test-Legacy/public/index.html"));
});
app.get("/voteResults", (req, res) => {
    res.sendFile(path.join(__dirname, "../Test-Legacy/public/voteResults.html"));
});
app.get("/electionResults", (req, res) => {
    res.sendFile(path.join(__dirname, "../Test-Legacy/public/electionResults.html"));
});

app.use(express.json());

//routes
app.use("/auth", authRouter);
// app.use("/election", authenticateUser, setElection, founderRoute, setAccountAbstraction, AARoute, setPaymaster, paymasterRoute);
// app.use("/election", authenticateUser, setElection, founderRoute);
app.use("/election", authenticateUser, setElection, founderRoute, AARoute, setPaymaster, paymasterRoute);
app.use("/vote", authenticateUser, voteRouter);
app.use('/user', authenticateUser, userRoute)

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const port = process.env.PORT || 5000;

const start = async () => {
    try {
        await connectDB(process.env.MONGO_URI);
        app.listen(port, console.log(`server listening on port ${port}...`));
    } catch (error) {
        console.log(error);
    }
};

start();
