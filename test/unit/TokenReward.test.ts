import { expect, assert } from "chai";
import { ethers, network } from "hardhat";
import { TokenReward, TokenReward__factory } from "../../typechain-types";

// Function
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

// Data
import {
  ADDRESS_ZERO,
  REWARD_AMOUNT,
  developmentChains,
} from "../../helper-hardhat-config";

// Types
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ContractTransaction, ContractReceipt } from "ethers/src.ts/ethers";
import { BigNumber } from "ethers";

// ------------

describe("TokenReward", function () {
  beforeEach(async () => {
    if (!developmentChains.includes(network.name)) {
      throw new Error(
        "You need to be on a development chain to run unit tests"
      );
    }
  });

  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  type DeployFixture = {
    deployer: SignerWithAddress;
    tokenReward: TokenReward;
  };
  async function deployTokenFixture(): Promise<DeployFixture> {
    const [deployer]: SignerWithAddress[] = await ethers.getSigners();

    const tokenRewardFactory: TokenReward__factory =
      await ethers.getContractFactory("TokenReward", deployer);
    const tokenReward: TokenReward = await tokenRewardFactory.deploy();
    await tokenReward.deployed();

    return { deployer, tokenReward };
  }

  describe("#mint", function () {
    it("should increase the balance of the user when minting", async function () {
      const { deployer, tokenReward } = await loadFixture(deployTokenFixture);

      await tokenReward.mint(REWARD_AMOUNT);

      const minterHoldings: BigNumber = await tokenReward.balanceOf(
        deployer.address
      );

      assert.equal(minterHoldings.toString(), REWARD_AMOUNT.toString());
    });
  });
});
