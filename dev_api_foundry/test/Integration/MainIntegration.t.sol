// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test, console} from "@forge-std/Test.sol";
import {MakePackedUserOp} from "../../script/MakePackedUserOp.s.sol";

import {TVoting} from "../../src/TVoting.sol";
import {VoterAccount} from "../../src/VoterAccount.sol";
import {Paymaster} from "../../src/Paymaster.sol";

import {EntryPoint} from "@eth-infinitism-account-abstraction/core/EntryPoint.sol";
import {PackedUserOperation} from "@eth-infinitism-account-abstraction/interfaces/PackedUserOperation.sol";

contract MainIntegration is Test {
    /**
     * TODO:
     * 1. get all rayshomar addresses and EntryPoint
     * 2. deploy TVoting
     * 3. deploy VoterAccount for each rayshomar address
     * 4. generate merkle root and proof
     * 5. deploy Paymaster
     * 6. fund Paymaster
     * 7. deposit to EntryPoint
     * 8. generate userOp
     * 9. send userOp to EntryPoint
     * 10. check the results in TVoting
     */

    TVoting tvoting;
    VoterAccount voterAccount;
    Paymaster paymaster;
    EntryPoint entryPoint;
    MakePackedUserOp makePackedUserOp;
    address[] voters;
    uint256[] pKeys;
    bytes32[] proof1;
    address bundleAcc;
    address moneyAcc;

    function setUp() public {
        // part 1 getting voters addresses
        voters = new address[](2);
        voters[0] = address(0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266);
        voters[1] = address(0x70997970C51812dc3A010C7d01b50e0d17dc79C8);

        console.log("the address of the voter is : ", voters[0]);

        pKeys = new uint256[](1);
        pKeys[
            0
        ] = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        console.log("the pKey of the voter is : ", pKeys[0]);

        entryPoint = new EntryPoint();

        console.log("entrypoint contract deployed at", address(entryPoint));

        // part 2 deploy TVoting
        tvoting = new TVoting(3);

        console.log("tvoting deployed at  : ", address(tvoting));

        // part 3 deploy VoterAccount for each rayshomar address
        voterAccount = new VoterAccount(
            address(entryPoint)
        );

        address[] memory tvoters = new address[](1);
        tvoters[0] = address(voterAccount);
        uint256[] memory numOfVotes = new uint256[](1);
        numOfVotes[0] = 1;
        tvoting.startElection(tvoters, numOfVotes);


        voterAccount.setForNewElection(voters[0], address(tvoting));
        

        console.log("voterAccount deployed at  : ", address(voterAccount));

        // part 4 generate merkle root and proof
        bytes32 merkleRoot = 0xd1573e3d5650743475aa0addfeef7e36cbfc4e060939615f4c3651e4b529d61c;

        proof1 = new bytes32[](1);
        proof1[
            0
        ] = 0x208697df1b2d4c083944c10909fe1ed6e99c1eaccff33ba129464b28f8245f01;


        //part 5 deploy paymaster
        paymaster = new Paymaster(address(entryPoint), merkleRoot);

        console.log("paymaster deployed at  : ", address(paymaster));

        //part 8 generate userOp
        makePackedUserOp = new MakePackedUserOp();

        bundleAcc = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8;

        moneyAcc = address(0xa0Ee7A142d267C1f36714E4a8F75612F20a79720);
    }

    function test_integration() public {
        // part 6 fund paymaster
        vm.deal(moneyAcc, 100 ether);
        console.log("Money acc balance",moneyAcc.balance);
        
        vm.startPrank(moneyAcc);
        (bool success, ) = address(paymaster).call{value: 30 ether}("");
        require(success, "Failed to send Ether");
        vm.stopPrank();

        console.log("paymaster balance",address(paymaster).balance);

        // part 7 deposit to entryPoint
        paymaster.addStake{value: 10 ether}(10);
        paymaster.deposit{value: 5 ether}();


        console.log("entryPoint balance : ", entryPoint.balanceOf(address(paymaster)));

        // part 8 generate userOp

        // address voterAcount,
        // bytes memory callData,
        uint8[] memory _candidates = new uint8[](3);
        _candidates[0] = 1;
        _candidates[1] = 0;
        _candidates[2] = 0;
        bytes memory callData = abi.encodeWithSelector(
            voterAccount.execute.selector,
            _candidates
        );
        console.log("callData");
        console.logBytes(callData);
        // bytes memory paymasterAndData,
        bytes memory merkleProof = abi.encodePacked(
            proof1[0]
        );

        console.log("merkleProof");
        console.logBytes(merkleProof);

        // address entryPoint,
        // uint256 privateKey
        PackedUserOperation memory userOp = makePackedUserOp
            .generateSignedUserOperation(
                address(voterAccount),
                callData,
                address(paymaster),
                merkleProof,
                address(entryPoint),
                pKeys[0]
            );  

            console.log("paymasterAndData");
            console.logBytes(userOp.paymasterAndData);

        // part 9 send packed user ops

        PackedUserOperation[] memory ops = new PackedUserOperation[](1);
        ops[0] = userOp;

        entryPoint.handleOps(ops, payable(bundleAcc));

        // part 10 check the resuls

        uint256 result = tvoting.getCandidateVoteNum(0);

        assertEq(1, result);
    }
}
