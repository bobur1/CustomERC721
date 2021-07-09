const SimpleERC20 = artifacts.require("./SimpleERC20.sol");
const CustomERC721 = artifacts.require("./CustomERC721.sol");
const chai = require("./setupchai.js");
const BN = web3.utils.BN;
const expect = chai.expect;

contract("CustomERC721", accounts => {
    const ownerAccount = accounts[0];
    const clientAccount1 = accounts[1];
    const clientAccount2 = accounts[2];
    const depositAmount = new BN(2000);
    const depositAmount2 = new BN(1000);
    let SimpleERC20Instance;
    let CustomERC721Instance;

    beforeEach(async function() {
      SimpleERC20Instance = await SimpleERC20.new({from: clientAccount1});
      CustomERC721Instance = await CustomERC721.new({from: ownerAccount});
    });

    it("Deposit ERC20 token in ERC721", async () => {   
      await SimpleERC20Instance.approve(CustomERC721Instance.address, depositAmount, {from: clientAccount1});
      let result = await CustomERC721Instance.depositERC20(SimpleERC20Instance.address, {from: clientAccount1});

      expect(result.logs[0].args.to).to.equal(clientAccount1);
      expect(result.logs[0].args.tokenId).bignumber.is.zero;
    });

    it("CANNOT deposit to ERC721 without any ERC20", async () => {   
      await SimpleERC20Instance.approve(CustomERC721Instance.address, depositAmount, {from: ownerAccount});
      
      return expect(CustomERC721Instance.depositERC20(SimpleERC20Instance.address, {from: ownerAccount})).to.be.eventually.rejected;
    });

    it("Transfer ERC721 token to some address", async () => {   
      await SimpleERC20Instance.approve(CustomERC721Instance.address, depositAmount, {from: clientAccount1});
      await CustomERC721Instance.depositERC20(SimpleERC20Instance.address, {from: clientAccount1});
      let result = await CustomERC721Instance.safeTransferFrom(clientAccount1, clientAccount2, 0, {from: clientAccount1});
      
      expect(result.logs[1].args.from).to.equal(clientAccount1);
      expect(result.logs[1].args.to).to.equal(clientAccount2);
      expect(result.logs[1].args.tokenId).bignumber.is.zero;
    });
    
    it("Withdraw ERC20 from ERC721 token", async () => {   
      await SimpleERC20Instance.approve(CustomERC721Instance.address, depositAmount, {from: clientAccount1});
      await CustomERC721Instance.depositERC20(SimpleERC20Instance.address, {from: clientAccount1});
      await CustomERC721Instance.safeTransferFrom(clientAccount1, clientAccount2, 0, {from: clientAccount1});
      await CustomERC721Instance.withDrawERC20(new BN(0), {from: clientAccount2});

      expect(await SimpleERC20Instance.balanceOf(clientAccount2)).bignumber.equal(depositAmount);
      let result = await CustomERC721Instance.tokenAmount(new BN(0));
      expect(result.amount).bignumber.is.zero;
      return expect(CustomERC721Instance.ownerOf(new BN(0))).to.be.eventually.rejected;
    });

    it("CANNOT withdraw in the second time the same ERC721 token", async () => {   
      await SimpleERC20Instance.approve(CustomERC721Instance.address, depositAmount, {from: clientAccount1});
      await CustomERC721Instance.depositERC20(SimpleERC20Instance.address, {from: clientAccount1});
      await CustomERC721Instance.safeTransferFrom(clientAccount1, clientAccount2, 0, {from: clientAccount1});
      await CustomERC721Instance.withDrawERC20(new BN(0), {from: clientAccount2});

      return expect(CustomERC721Instance.withDrawERC20(new BN(0), {from: clientAccount2})).to.be.eventually.rejected;
    });

    it("CANNOT withdraw ERC20 from ERC721 token without owning any ERC721 token", async () => {   
      await SimpleERC20Instance.approve(CustomERC721Instance.address, depositAmount, {from: clientAccount1});
      await CustomERC721Instance.depositERC20(SimpleERC20Instance.address, {from: clientAccount1});

      return expect(CustomERC721Instance.withDrawERC20(new BN(0), {from: ownerAccount})).to.be.eventually.rejected;
    });

    it("Withdraw partially ERC20 from ERC721 token", async () => {   
      await SimpleERC20Instance.approve(CustomERC721Instance.address, depositAmount, {from: clientAccount1});
      await CustomERC721Instance.depositERC20(SimpleERC20Instance.address, {from: clientAccount1});
      await CustomERC721Instance.safeTransferFrom(clientAccount1, clientAccount2, 0, {from: clientAccount1});
      await CustomERC721Instance.partiallyWithDrawERC20(new BN(0), depositAmount2, {from: clientAccount2});

      expect(await SimpleERC20Instance.balanceOf(clientAccount2)).bignumber.equal(depositAmount2);
      let result = await CustomERC721Instance.tokenAmount(new BN(0));
      expect(result.amount).bignumber.equal(depositAmount2);
      expect(await CustomERC721Instance.ownerOf(new BN(0))).equal(clientAccount2);
    });

    it("Withdraw partially ERC20 from ERC721 token and send it to another account", async () => {   
      await SimpleERC20Instance.approve(CustomERC721Instance.address, depositAmount, {from: clientAccount1});
      await CustomERC721Instance.depositERC20(SimpleERC20Instance.address, {from: clientAccount1});
      await CustomERC721Instance.safeTransferFrom(clientAccount1, clientAccount2, 0, {from: clientAccount1});
      await CustomERC721Instance.partiallyWithDrawERC20(new BN(0), depositAmount2, {from: clientAccount2});
      
      await CustomERC721Instance.safeTransferFrom(clientAccount2, ownerAccount, 0, {from: clientAccount2});
      await CustomERC721Instance.withDrawERC20(new BN(0), {from: ownerAccount});

      expect(await SimpleERC20Instance.balanceOf(ownerAccount)).bignumber.equal(depositAmount2);
      let result = await CustomERC721Instance.tokenAmount(new BN(0));
      expect(result.amount).bignumber.is.zero;
      return expect(CustomERC721Instance.ownerOf(new BN(0))).to.be.eventually.rejected;
    });

    it("CANNOT partially withdraw more than balance of ERC721 token", async () => {   
      await SimpleERC20Instance.approve(CustomERC721Instance.address, depositAmount2, {from: clientAccount1});
      await CustomERC721Instance.depositERC20(SimpleERC20Instance.address, {from: clientAccount1});
      await CustomERC721Instance.safeTransferFrom(clientAccount1, clientAccount2, 0, {from: clientAccount1});
      
      return expect(CustomERC721Instance.partiallyWithDrawERC20(new BN(0), depositAmount, {from: clientAccount2})).to.be.eventually.rejected;
    });

    it("CANNOT partially withdraw after the burn of ERC721 token", async () => {   
      await SimpleERC20Instance.approve(CustomERC721Instance.address, depositAmount, {from: clientAccount1});
      await CustomERC721Instance.depositERC20(SimpleERC20Instance.address, {from: clientAccount1});
      await CustomERC721Instance.safeTransferFrom(clientAccount1, clientAccount2, 0, {from: clientAccount1});
      await CustomERC721Instance.partiallyWithDrawERC20(new BN(0), depositAmount, {from: clientAccount2});
      
      await expect(CustomERC721Instance.ownerOf(new BN(0))).to.be.eventually.rejected;
      return expect(CustomERC721Instance.partiallyWithDrawERC20(new BN(0), depositAmount, {from: clientAccount2})).to.be.eventually.rejected;
    });
});