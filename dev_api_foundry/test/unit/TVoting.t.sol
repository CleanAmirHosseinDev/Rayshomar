// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@forge-std/Test.sol";
import "../../src/TVoting.sol";

contract TVotingTest is Test {
    TVoting tVoting;
    address owner = address(0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266);
    address voter1 = address(0x70997970C51812dc3A010C7d01b50e0d17dc79C8);
    address voter2 = address(0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC);
    address nonVoter = address(0x90F79bf6EB2c4f870365E785982E1f101E93b906);
    address[] voters = [voter1, voter2];
    uint256[] numOfVotes = [1, 2];

    function setUp() public {
        vm.startPrank(owner);
        tVoting = new TVoting(3);
        tVoting.startElection(voters, numOfVotes);
        vm.stopPrank();
    }

    /*//////////////////////////////////////////////////////////////
                                 RESULT()
    //////////////////////////////////////////////////////////////*/

    function test_not_owner_cant_get_results() public {
        vm.prank(owner);
        uint256 result = tVoting.results();
        assertEq(result, 0, "Initial winner should be candidate 0");

        vm.expectRevert(NotOwner__TVoting.selector);
        tVoting.results();
    }

    /*//////////////////////////////////////////////////////////////
                                  VOTE()
    //////////////////////////////////////////////////////////////*/

    function test_non_registered_voter_cant_vote() public {
        vm.prank(nonVoter);
        uint256[] memory candidates = new uint256[](3);
        candidates[0] = 1;
        candidates[1] = 2;
        candidates[2] = 2;

        vm.expectRevert(NotVoter__TVoting.selector);
        tVoting.vote(candidates);
    }

    function test_voters_votesLeft_decrease_when_vote() public {
        vm.prank(voter1);
        uint256[] memory candidates = new uint256[](2);
        candidates[0] = 1;
        candidates[1] = 0;
        tVoting.vote(candidates);
        (, int256 votesLeft) = tVoting.getVoter(voter1);
        assertEq(votesLeft, 0);
    }

    function test_voters_cant_vote_when_no_votesLeft() public {
        vm.prank(voter2);
        uint256[] memory candidates = new uint256[](2);
        candidates[0] = 1;
        candidates[1] = 1;
        tVoting.vote(candidates);
        

        vm.prank(voter1);
        vm.expectRevert(MoreThanVotesLeft__TVoting.selector);
        tVoting.vote(candidates);
    }

    function test_voter_cant_vote_nonExistant_candidate() public {
        vm.prank(voter1);
        uint256[] memory candidates = new uint256[](4);
        candidates[0] = 1;
        candidates[1] = 1;
        candidates[2] = 1;
        candidates[3] = 1; // Nonexistent candidate (index out of bounds)

        vm.expectRevert(InvalidNumOfCandidates__TVoting.selector);
        tVoting.vote(candidates);
    }

    //write test for emissions
}
