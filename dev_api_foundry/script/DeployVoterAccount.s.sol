// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "@forge-std/Script.sol";
import {VoterAccountFactory} from "../src/VoterAccountFactory.sol";
import {VoterAccountConfig} from "./HelperConfig.s.sol";

contract DeployVoterAccount is Script {
    function run() external returns (VoterAccountFactory) {
        VoterAccountConfig config = new VoterAccountConfig();
        VoterAccountConfig.Config memory voterAccountConfig = config.run();

        vm.startBroadcast();
        VoterAccountFactory factory = new VoterAccountFactory(
            voterAccountConfig._entryPoint
        );
        vm.stopBroadcast();

        console.log("Deployed VoterAccountFactory address:", address(factory));
        return factory;
    }
}
