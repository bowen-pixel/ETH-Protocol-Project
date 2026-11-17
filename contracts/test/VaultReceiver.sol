// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {EthVault} from "../EthVault.sol";

/// @dev Test fixture for hostile or incompatible withdrawal receivers.
contract VaultReceiver {
    EthVault public immutable vault;
    bool public rejectEther;
    bool public attemptReentry;
    bool public reentrySucceeded;

    constructor(EthVault target) { vault = target; }
    function deposit() external payable { vault.deposit{value: msg.value}(); }
    function withdraw(uint256 amount, bool reject, bool reenter) external {
        rejectEther = reject;
        attemptReentry = reenter;
        vault.withdraw(amount);
    }
    receive() external payable {
        require(!rejectEther, "Receiver rejected ETH");
        if (attemptReentry) {
            attemptReentry = false;
            (reentrySucceeded, ) = address(vault).call(
                abi.encodeCall(EthVault.withdraw, (msg.value))
            );
        }
    }
}
