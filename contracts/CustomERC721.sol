// SPDX-License-Identifier: MIT
pragma solidity ^0.8;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";

contract CustomERC721 is ERC721, ERC721Burnable {
    using SafeERC20 for IERC20;
   
    struct tokenAmountS{
        address tokenAddress;
        uint256 amount;
    }
   
    tokenAmountS[] public tokenAmount;

    constructor() ERC721("CustomToken", "CTK") {}
    
    function depositERC20(IERC20 _token) public {
        uint256 _tokenAmount = _token.allowance(msg.sender, address(this));
        require(_tokenAmount > 0, "Need to approve token to this contract");
        uint256 _currentTokenId = tokenAmount.length;
        _safeMint(msg.sender, _currentTokenId);
        _token.safeTransferFrom(msg.sender, address(this), _tokenAmount);
         tokenAmount.push(tokenAmountS(address(_token), _tokenAmount));
    }
    
    function withDrawERC20(uint _id) public {
        burn(_id);
        IERC20 _token = IERC20(tokenAmount[_id].tokenAddress);
        _token.safeTransfer(msg.sender, tokenAmount[_id].amount);
        tokenAmount[_id].amount = 0;
    }

    function partiallyWithDrawERC20(uint _id, uint _amount) public {
        require(_amount > 0, "You cannot withdraw zero tokens");
        require(tokenAmount[_id].amount >= _amount, "Transfer amount exceeds token balance");
        require(ownerOf(_id) == msg.sender, "This token is not belongs to you");
        
        if(tokenAmount[_id].amount != _amount) {
        IERC20 _token = IERC20(tokenAmount[_id].tokenAddress);        
        tokenAmount[_id].amount = tokenAmount[_id].amount - _amount;
        _token.safeTransfer(msg.sender, _amount);
        } else {
            withDrawERC20(_id);
        }
    }
}