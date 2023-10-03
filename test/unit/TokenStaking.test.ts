import { expect, assert } from "chai";
import { ethers, network } from "hardhat";
import { TokenStaking, TokenStaking__factory } from "../../typechain-types";

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

describe("TokenStaking", function () {
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
    tokenStaking: TokenStaking;
  };
  async function deployTokenFixture(): Promise<DeployFixture> {
    const [deployer]: SignerWithAddress[] = await ethers.getSigners();

    const tokenStakingFactory: TokenStaking__factory =
      await ethers.getContractFactory("TokenStaking", deployer);
    const tokenStaking: TokenStaking = await tokenStakingFactory.deploy();
    await tokenStaking.deployed();

    return { deployer, tokenStaking };
  }

  describe("#mint", function () {
    it("should increase the balance of the user when minting", async function () {
      const { deployer, tokenStaking } = await loadFixture(deployTokenFixture);

      await tokenStaking.mint(REWARD_AMOUNT);

      const minterHoldings: BigNumber = await tokenStaking.balanceOf(
        deployer.address
      );

      assert.equal(minterHoldings.toString(), REWARD_AMOUNT.toString());
    });
  });
});
