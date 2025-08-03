// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "@forge-std/Script.sol";
import {EntryPoint} from "@eth-infinitism-account-abstraction/core/EntryPoint.sol";

contract DeployEntryPoint is Script {
    function run() external {
        vm.startBroadcast();
        EntryPoint entryPoint = new EntryPoint();
        console.log("Deployed contract address:", address(entryPoint));
        vm.stopBroadcast();
    }
}
