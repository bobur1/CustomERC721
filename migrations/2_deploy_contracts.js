var SimpleERC20 = artifacts.require("./SimpleERC20.sol");
var CustomERC721V2 = artifacts.require("./CustomERC721V2.sol");

module.exports = function(deployer) {
  deployer.deploy(SimpleERC20).then(function() {
    deployer.deploy(CustomERC721V2, SimpleERC20.address);
  });
};
