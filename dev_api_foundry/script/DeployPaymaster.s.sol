// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "@forge-std/Script.sol";
import {Paymaster} from "../src/Paymaster.sol";
import {PaymasterConfig} from "./HelperConfig.s.sol";

contract DeployPaymaster is Script {
    function run() external {
        PaymasterConfig config = new PaymasterConfig();
        PaymasterConfig.Config memory paymasterConfig = config.run();

        vm.startBroadcast();
        Paymaster paymaster = new Paymaster(
            paymasterConfig._entryPoint,
            paymasterConfig._merkleRoot
        );

        console.log("Deployed contract address:", address(paymaster));

        paymaster.addStake{value: 0.1 ether}(100);

        paymaster.deposit{value: 0.1 ether}();

        vm.stopBroadcast();
    }
}
