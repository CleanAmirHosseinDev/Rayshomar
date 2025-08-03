// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "@forge-std/Script.sol";
import {VoterAccount} from "../src/VoterAccount.sol";
import {VoterAccountConfig} from "./HelperConfig.s.sol";

import {VoterAccount} from "../src/VoterAccount.sol";

contract DeployVoterAccount is Script {
    function run() external {
        VoterAccountConfig config = new VoterAccountConfig();
        VoterAccountConfig.Config memory voterAccountConfig = config.run();

        vm.startBroadcast();
        VoterAccount tvoting = new VoterAccount(
            voterAccountConfig._entryPoint       
        );

        console.log("Deployed contract address:", address(tvoting));
        vm.stopBroadcast();
    }
}
