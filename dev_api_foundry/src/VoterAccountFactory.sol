// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {VoterAccount} from "./VoterAccount.sol";
import {IEntryPoint} from "@eth-infinitism-account-abstraction/interfaces/IEntryPoint.sol";

/**
 * @title کارخانه (Factory) برای ایجاد حساب‌های رای‌دهنده
 * @author Rayshomar Team
 * @notice این قرارداد مسئول ایجاد و استقرار حساب‌های هوشمند جدید برای رای‌دهندگان است.
 * این کارخانه از الگوی CREATE2 برای ایجاد آدرس‌های قطعی (deterministic) استفاده می‌کند.
 */
contract VoterAccountFactory {
    IEntryPoint public immutable entryPoint;

    /**
     * @notice سازنده قرارداد که آدرس EntryPoint را به عنوان ورودی می‌گیرد.
     * @param _entryPoint آدرس قرارداد EntryPoint.
     */
    constructor(address _entryPoint) {
        entryPoint = IEntryPoint(_entryPoint);
    }

    /**
     * @notice یک حساب کاربری جدید برای رای‌دهنده ایجاد می‌کند.
     * @dev این تابع باید توسط EntryPoint فراخوانی شود تا امنیت حفظ شود.
     * از CREATE2 برای استقرار استفاده می‌کند تا آدرس قابل پیش‌بینی باشد.
     * @param _owner آدرس مالک حساب جدید (رای‌دهنده).
     * @param _tVoting آدرس قرارداد رای‌گیری که حساب با آن تعامل خواهد داشت.
     * @param _salt یک مقدار تصادفی برای اطمینان از یکتایی آدرس در CREATE2.
     * @return account آدرس حساب جدید ایجاد شده.
     */
    function createAccount(
        address _owner,
        address _tVoting,
        uint256 _salt
    ) external returns (VoterAccount account) {
        // امنیتی: بررسی می‌شود که آیا این تابع توسط خود EntryPoint فراخوانی شده است یا خیر.
        // این کار از حملات front-running روی initCode جلوگیری می‌کند.
        require(
            msg.sender == address(entryPoint.senderCreator()),
            "Factory: not from entry point"
        );

        bytes32 salt = bytes32(_salt);
        bytes memory bytecode = type(VoterAccount).creationCode;
        bytes memory constructorArgs = abi.encode(address(entryPoint));
        bytes memory fullBytecode = abi.encodePacked(bytecode, constructorArgs);

        address addr;
        assembly {
            addr := create2(
                0,
                add(fullBytecode, 0x20),
                mload(fullBytecode),
                salt
            )
        }
        require(addr != address(0), "CREATE2_FAILED");

        account = VoterAccount(payable(addr));

        account.setForNewElection(_owner, _tVoting);
        account.transferOwnership(_owner);
    }

    /**
     * @notice آدرس یک حساب را قبل از ایجاد آن محاسبه می‌کند.
     * @param _owner آدرس مالک حساب.
     * @param _salt مقدار salt.
     * @return آدرس حساب.
     */
    function getAddress(
        address _owner,
        uint256 _salt
    ) public view returns (address) {
        bytes32 salt = bytes32(_salt);
        bytes memory bytecode = type(VoterAccount).creationCode;
        bytes memory constructorArgs = abi.encode(address(entryPoint));
        bytes memory fullBytecode = abi.encodePacked(bytecode, constructorArgs);

        return
            address(
                uint160(
                    uint(
                        keccak256(
                            abi.encodePacked(
                                bytes1(0xff),
                                address(this),
                                salt,
                                keccak256(fullBytecode)
                            )
                        )
                    )
                )
            );
    }
}
