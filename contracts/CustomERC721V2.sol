// SPDX-License-Identifier: MIT
pragma solidity ^0.8;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract CustomERC721V2 is ERC721 {
    using SafeERC20 for IERC20;
   
    mapping(uint256 => uint256) public tokenIdToAmount;
    mapping(address => uint256[]) public tokensOwnedByAddress;
    uint256 private tokenId;
    IERC20 private token;

    constructor(IERC20 _token) ERC721("CustomToken", "CTK") {
        token = _token;
    }
    
    function depositERC20(uint256 _tokenAmount) external {
        require(_tokenAmount > 0, "Token amount should be more than zero");
        _safeMint(msg.sender, tokenId);
        token.safeTransferFrom(msg.sender, address(this), _tokenAmount);
        tokenIdToAmount[tokenId] = _tokenAmount;
        tokenId++;
    }
    
    function _beforeTokenTransfer(address _from, address _to, uint256 _tokenId) internal override {
        if(_from != address(0)) {
            for(uint256 i; i < tokensOwnedByAddress[_from].length; i ++) {
                 if(tokensOwnedByAddress[_from][i] == _tokenId) {
                    // Rewrite our last element with deleting one...
                    tokensOwnedByAddress[_from][i] = tokensOwnedByAddress[_from][tokensOwnedByAddress[_from].length - 1];
                    // Remove the last element
                    tokensOwnedByAddress[_from].pop();
                     
                     if(_to != address(0)) {
                         tokensOwnedByAddress[_to].push(tokenId);
                     }
                     
                     break;
                 }
            }
        } else {
            tokensOwnedByAddress[_to].push(tokenId);
        }
    }
    
    function withDrawERC20(uint _id) external {
        partiallyWithDrawERC20(_id, tokenIdToAmount[_id]);
    }

    function partiallyWithDrawERC20(uint _id, uint _amount) public {
        require(_amount > 0, "You cannot withdraw zero tokens");
        require(tokenIdToAmount[_id] >= _amount, "Transfer amount exceeds token balance");
        require(ownerOf(_id) == msg.sender, "This token is not belongs to you");
    
        tokenIdToAmount[_id] = tokenIdToAmount[_id] - _amount;
        token.safeTransfer(msg.sender, _amount);

        if(tokenIdToAmount[_id] == 0) {
            _burn(_id);
        }
    }

    function balanceOfDeposited(address _ownerOfReceipts) external view returns(uint256) {
        if ( balanceOf(_ownerOfReceipts) == 0) {
            return 0;
        } else {
            uint256 result;
            
            for(uint256 i; i < tokensOwnedByAddress[_ownerOfReceipts].length; i++) {
                result = result + tokenIdToAmount[tokensOwnedByAddress[_ownerOfReceipts][i]];
            }

            return result;
        }
    }

    function getAllTokensOfOwner(address _ownerOfTokens) external view returns(uint256[] memory ownerTokens) {
        if ( balanceOf(_ownerOfTokens) == 0) {
            return new uint256[](0);
        } else {
            return tokensOwnedByAddress[_ownerOfTokens];
        }
    }

    function balanceOfReceipt(uint256 _tokenId) external view returns(uint256) {
        return tokenIdToAmount[_tokenId];
    }
}