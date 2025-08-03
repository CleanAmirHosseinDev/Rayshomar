// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "@forge-std/Script.sol";
import {TVoting} from "../src/TVoting.sol";
import {ElectionConfig} from "./HelperConfig.s.sol";

contract DeployTVoting is Script {
    function run() external {
        ElectionConfig config = new ElectionConfig();
        ElectionConfig.Config memory electionconfig = config.run();

        vm.startBroadcast();
        TVoting tvoting = new TVoting(
            electionconfig.NUM_OF_CANDIDATES
        );

        console.log("Deployed contract address:", address(tvoting));
        vm.stopBroadcast();
    }
}
