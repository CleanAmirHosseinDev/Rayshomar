// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {TVoting} from "../src/TVoting.sol";

import {Script} from "@forge-std/Script.sol";
import {Vm, VmSafe} from "@forge-std/Vm.sol";
import {stdJson} from "@forge-std/StdJson.sol";

import {IEntryPoint} from "@eth-infinitism-account-abstraction/interfaces/IEntryPoint.sol";

abstract contract CONSTANTS is Script {}

contract ElectionConfig is Script {
    using stdJson for string;

    struct Config {
        uint8 NUM_OF_CANDIDATES;
        // address[] voters;
        // uint256[] NUM_OF_VOTES;
    }

    Config public config;

    function getElectionConfig() public returns (Config memory) {
        string memory json = vm.readFile(
            "./TransferData/ElectionData/election.json"
        );
        uint256 numOfCandidates = json.readUint(".NUM_OF_CANDIDATES");
        // address[] memory voters = json.readAddressArray(".voters");
        // uint256[] memory numOfVotes = json.readUintArray(".NUM_OF_VOTES");

        config = Config({
            NUM_OF_CANDIDATES: uint8(numOfCandidates)
            // voters: voters,
            // NUM_OF_VOTES: numOfVotes
        });

        return config;
    }

    function run() external returns (Config memory) {
        return getElectionConfig();
    }
}

contract PaymasterConfig is Script {
    using stdJson for string;

    struct Config {
        address _entryPoint;
        bytes32 _merkleRoot;
    }

    Config public config;

    function getElectionConfig() public returns (Config memory) {
        string memory json = vm.readFile(
            "./TransferData/PaymasterData/paymaster.json"
        );

        address entryPoint = json.readAddress(".Entrypoint");
        bytes32 merkleRoot = json.readBytes32(".MerkleRootHash");

        config = Config({_entryPoint: entryPoint, _merkleRoot: merkleRoot});

        return config;
    }

    function run() external returns (Config memory) {
        return getElectionConfig();
    }
}

contract VoterAccountConfig is Script {
    using stdJson for string;

    struct Config {
        address _entryPoint;
        // address _tvoting;
        // address _rayshomarAddress;
    }

    Config public config;

    function getElectionConfig() public returns (Config memory) {
        string memory json = vm.readFile(
            "./TransferData/VoterAccountData/VoterAccount.json"
        );

        address entryPoint = json.readAddress(".Entrypoint");
        // address tvoting = json.readAddress(".TVoting");
        // address rayshomarAddress = json.readAddress(".RayshomarAddress");

        config = Config({
            _entryPoint: entryPoint
            // _tvoting: tvoting,
            // _rayshomarAddress: rayshomarAddress
        });

        return config;
    }

    function run() external returns (Config memory) {
        return getElectionConfig();
    }
}
