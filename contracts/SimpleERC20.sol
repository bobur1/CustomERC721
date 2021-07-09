// SPDX-License-Identifier: MIT
pragma solidity ^0.8;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract SimpleERC20 is ERC20 {
    constructor() ERC20("SimpleToken", "STK") {
        _mint(msg.sender, 10 * 10 **18);
    }
}