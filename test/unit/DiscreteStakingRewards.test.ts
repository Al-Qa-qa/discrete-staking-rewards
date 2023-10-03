import { expect, assert } from "chai";
import { ethers, network } from "hardhat";
import {
  DiscreteStakingRewards,
  DiscreteStakingRewards__factory,
  TokenStaking,
  TokenStaking__factory,
  TokenReward,
  TokenReward__factory,
} from "../../typechain-types";

// Function
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

// Data
import {
  ADDRESS_ZERO,
  ONE_TOKEN,
  REWARD_AMOUNT,
  STAKING_AMOUNT,
  developmentChains,
} from "../../helper-hardhat-config";

// Types
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ContractTransaction, ContractReceipt } from "ethers/src.ts/ethers";
import { BigNumber } from "ethers";

// ------------

describe("DiscreteStakingRewards", function () {
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
    discreteStakingRewards: DiscreteStakingRewards;
    tokenStaking: TokenStaking;
    tokenReward: TokenReward;
  };
  async function deployDiscreteStakingRewardsFixture(): Promise<DeployFixture> {
    const [deployer]: SignerWithAddress[] = await ethers.getSigners();

    const tokenStakingFactory: TokenStaking__factory =
      await ethers.getContractFactory("TokenStaking", deployer);

    const tokenStaking: TokenStaking = await tokenStakingFactory.deploy();
    await tokenStaking.deployed();

    const tokenRewardFactory: TokenReward__factory =
      await ethers.getContractFactory("TokenReward", deployer);
    const tokenReward: TokenReward = await tokenRewardFactory.deploy();
    await tokenReward.deployed();

    const discreteStakingRewardsFactory: DiscreteStakingRewards__factory =
      await ethers.getContractFactory("DiscreteStakingRewards", deployer);
    const discreteStakingRewards: DiscreteStakingRewards =
      await discreteStakingRewardsFactory.deploy(
        tokenStaking.address,
        tokenReward.address
      );
    await discreteStakingRewards.deployed();
    return { deployer, discreteStakingRewards, tokenStaking, tokenReward };
  }

  async function mintAndStake(
    discreteStakingRewards: DiscreteStakingRewards,
    tokenStaking: TokenStaking,
    staker: SignerWithAddress
  ) {
    await tokenStaking.connect(staker).mint(STAKING_AMOUNT);
    await tokenStaking
      .connect(staker)
      .approve(discreteStakingRewards.address, STAKING_AMOUNT);
    await discreteStakingRewards.connect(staker).stake(STAKING_AMOUNT);
  }

  async function mintAndUpdateRewardIndex(
    discreteStakingRewards: DiscreteStakingRewards,
    tokenReward: TokenReward,
    tokenGiver: SignerWithAddress
  ) {
    await tokenReward.connect(tokenGiver).mint(REWARD_AMOUNT);
    await tokenReward
      .connect(tokenGiver)
      .approve(discreteStakingRewards.address, REWARD_AMOUNT);

    await discreteStakingRewards.updateRewardIndex(REWARD_AMOUNT);
  }

  // async function logData(
  //   stakingRewards: StakingRewards,
  //   staker: SignerWithAddress
  // ) {
  //   const rewardRate = await stakingRewards.getRewardRate();
  //   const rewardPerToken = await stakingRewards.getRewardPerToken();
  //   const userRewardPerTokenPaid = await stakingRewards.userRewardPerTokenPaid(
  //     staker.address
  //   );
  //   const userReward = await stakingRewards.rewards(staker.address);
  //   const userBalance = await stakingRewards.balanceOf(staker.address);
  //   const userEarnings = await stakingRewards.getUserEarnings(staker.address);

  //   console.log(`-------------------`);
  //   console.log(`rewardRate: ${ethers.utils.formatUnits(rewardRate)}`);
  //   console.log(`rewardPerToken: ${ethers.utils.formatUnits(rewardPerToken)}`);
  //   console.log(
  //     `userRewardPerTokenPaid: ${ethers.utils.formatUnits(
  //       userRewardPerTokenPaid
  //     )}`
  //   );
  //   console.log(`userReward: ${ethers.utils.formatUnits(userReward)}`);
  //   console.log(`userBalance: ${ethers.utils.formatUnits(userBalance)}`);
  //   console.log(`userEarnings: ${ethers.utils.formatUnits(userEarnings)}`);
  //   console.log(`-------------------`);
  // }

  describe("Constructor", function () {
    it("should initialize the first token address successfully", async function () {
      const { discreteStakingRewards, tokenStaking } = await loadFixture(
        deployDiscreteStakingRewardsFixture
      );

      const tokenStakingAddress =
        await discreteStakingRewards.getStakingToken();

      assert.equal(tokenStakingAddress, tokenStaking.address);
    });

    it("should initialize the second token address successfully", async function () {
      const { discreteStakingRewards, tokenReward } = await loadFixture(
        deployDiscreteStakingRewardsFixture
      );

      const tokenRewardAddress = await discreteStakingRewards.getRewardToken();

      assert.equal(tokenRewardAddress, tokenReward.address);
    });
  });

  describe("#stake", function () {
    it("should emit `stake` event on successful staking", async function () {
      const [, staker]: SignerWithAddress[] = await ethers.getSigners();
      const { deployer, discreteStakingRewards, tokenStaking, tokenReward } =
        await loadFixture(deployDiscreteStakingRewardsFixture);

      await tokenStaking.connect(staker).mint(STAKING_AMOUNT);
      await tokenStaking
        .connect(staker)
        .approve(discreteStakingRewards.address, STAKING_AMOUNT);

      await expect(discreteStakingRewards.connect(staker).stake(STAKING_AMOUNT))
        .to.emit(discreteStakingRewards, "Stake")
        .withArgs(staker.address, STAKING_AMOUNT);
    });

    it("should transfer tokens from `staker` to the contract", async function () {
      const [, staker]: SignerWithAddress[] = await ethers.getSigners();

      const { deployer, discreteStakingRewards, tokenStaking, tokenReward } =
        await loadFixture(deployDiscreteStakingRewardsFixture);

      await mintAndStake(discreteStakingRewards, tokenStaking, staker);

      const contractBalance: BigNumber = await tokenStaking
        .connect(staker)
        .balanceOf(discreteStakingRewards.address);
      assert.equal(contractBalance.toString(), STAKING_AMOUNT.toString());
    });

    it("should increase the balance of the staker in the contract", async function () {
      const [, staker]: SignerWithAddress[] = await ethers.getSigners();
      const { deployer, discreteStakingRewards, tokenStaking, tokenReward } =
        await loadFixture(deployDiscreteStakingRewardsFixture);

      await mintAndStake(discreteStakingRewards, tokenStaking, staker);

      const stakerBalance: BigNumber = await discreteStakingRewards
        .connect(staker)
        .balanceOf(staker.address);
      assert.equal(stakerBalance.toString(), STAKING_AMOUNT.toString());
    });

    it("should increase the `totalSupply`", async function () {
      const [, staker]: SignerWithAddress[] = await ethers.getSigners();
      const { deployer, discreteStakingRewards, tokenStaking, tokenReward } =
        await loadFixture(deployDiscreteStakingRewardsFixture);

      await mintAndStake(discreteStakingRewards, tokenStaking, staker);

      const totalSupply: BigNumber = await discreteStakingRewards
        .connect(staker)
        .totalSupply();
      assert.equal(totalSupply.toString(), STAKING_AMOUNT.toString());
    });

    // it("should set `rewards[staker]` to zero and when another staking occuars, it should update it to staker earnings", async function () {
    //   const [, staker]: SignerWithAddress[] = await ethers.getSigners();
    //   const { deployer, stakingRewards, tokenStaking, tokenReward } =
    //     await loadFixture(deployDiscreteStakingRewardsFixture);

    //   await listStake(stakingRewards, tokenReward);
    //   await mintAndStake(stakingRewards, tokenStaking, staker);

    //   const userRewardsBeforeStake2: BigNumber = await stakingRewards.rewards(
    //     staker.address
    //   );

    //   await increaseTime(ONE_DAY);

    //   await mintAndStake(stakingRewards, tokenStaking, staker);

    //   const userRewardsAfterStake2: BigNumber = await stakingRewards.rewards(
    //     staker.address
    //   );

    //   // User rewards should be zero if he made only one stake
    //   assert.equal(userRewardsBeforeStake2.toString(), "0");
    //   // the rewards should be updated in the second stake
    //   // NOTE: some seconds may pass, so the valud can be greater than staking for only one day
    //   assert(userRewardsAfterStake2.gte(ONE_TOKEN.mul(ONE_DAY)));
    // });
  });

  describe("#unStake", function () {
    it("should emit `UnStake` event on successful unStaking", async function () {
      const [, staker]: SignerWithAddress[] = await ethers.getSigners();
      const { deployer, discreteStakingRewards, tokenStaking, tokenReward } =
        await loadFixture(deployDiscreteStakingRewardsFixture);

      await mintAndStake(discreteStakingRewards, tokenStaking, staker);

      await expect(
        discreteStakingRewards.connect(staker).unStake(STAKING_AMOUNT)
      )
        .to.emit(discreteStakingRewards, "UnStake")
        .withArgs(staker.address, STAKING_AMOUNT);
    });

    it("should transfer tokens from the contract to the `staker`", async function () {
      const [, staker]: SignerWithAddress[] = await ethers.getSigners();
      const { deployer, discreteStakingRewards, tokenStaking, tokenReward } =
        await loadFixture(deployDiscreteStakingRewardsFixture);

      await mintAndStake(discreteStakingRewards, tokenStaking, staker);

      // await increaseTime(ONE_DAY);

      await discreteStakingRewards.connect(staker).unStake(STAKING_AMOUNT);

      const contractBalance: BigNumber = await tokenStaking.balanceOf(
        discreteStakingRewards.address
      );
      assert.equal(contractBalance.toString(), "0");
    });

    it("should decrease the balance of the staker in the contract", async function () {
      const [, staker]: SignerWithAddress[] = await ethers.getSigners();
      const { deployer, discreteStakingRewards, tokenStaking, tokenReward } =
        await loadFixture(deployDiscreteStakingRewardsFixture);

      await mintAndStake(discreteStakingRewards, tokenStaking, staker);

      await discreteStakingRewards.connect(staker).unStake(STAKING_AMOUNT);
      const stakerBalance: BigNumber = await discreteStakingRewards.balanceOf(
        deployer.address
      );
      assert.equal(stakerBalance.toString(), "0");
    });

    it("should decrease the `totalSupply`", async function () {
      const [, staker]: SignerWithAddress[] = await ethers.getSigners();
      const { deployer, discreteStakingRewards, tokenStaking, tokenReward } =
        await loadFixture(deployDiscreteStakingRewardsFixture);

      await mintAndStake(discreteStakingRewards, tokenStaking, staker);
      await discreteStakingRewards.connect(staker).unStake(STAKING_AMOUNT);

      const totalSupply: BigNumber = await discreteStakingRewards.totalSupply();
      assert.equal(totalSupply.toString(), "0");
    });
  });

  describe("#updateRewardIndex", function () {
    it("reverts if the these is no staking tokens", async function () {
      const [, staker]: SignerWithAddress[] = await ethers.getSigners();
      const { deployer, discreteStakingRewards, tokenStaking, tokenReward } =
        await loadFixture(deployDiscreteStakingRewardsFixture);

      await expect(
        discreteStakingRewards.updateRewardIndex(0)
      ).to.be.revertedWithCustomError(
        discreteStakingRewards,
        "DiscreteStakingRewards__NoStakeTokens"
      );
    });
    it("should transfer rewardTokens from the caller to the contract", async function () {
      const [, staker]: SignerWithAddress[] = await ethers.getSigners();
      const { deployer, discreteStakingRewards, tokenStaking, tokenReward } =
        await loadFixture(deployDiscreteStakingRewardsFixture);

      // Stake tokens to get rewards when there is an updade in the rewardIndex
      await mintAndStake(discreteStakingRewards, tokenStaking, staker);

      // Set new rewardIndex
      await mintAndUpdateRewardIndex(
        discreteStakingRewards,
        tokenReward,
        deployer
      );

      const contractBalance: BigNumber = await tokenReward.balanceOf(
        discreteStakingRewards.address
      );

      assert.equal(contractBalance.toString(), REWARD_AMOUNT.toString());
    });
    it("should update rewardIndex, by setting rewards to the staker", async function () {
      const [, staker]: SignerWithAddress[] = await ethers.getSigners();
      const { deployer, discreteStakingRewards, tokenStaking, tokenReward } =
        await loadFixture(deployDiscreteStakingRewardsFixture);

      // Stake tokens to get rewards when there is an updade in the rewardIndex
      await mintAndStake(discreteStakingRewards, tokenStaking, staker);

      // Set new rewardIndex
      await mintAndUpdateRewardIndex(
        discreteStakingRewards,
        tokenReward,
        deployer
      );

      const stakerRewards: BigNumber =
        await discreteStakingRewards.calculateRewardsEarned(staker.address);

      console.log(ethers.utils.formatUnits(stakerRewards));

      assert.equal(stakerRewards.toString(), REWARD_AMOUNT.toString());
    });
  });

  describe("#claimRewards", function () {
    it("should emit `RewardsClaimed` event on successful withdrawing", async function () {
      const [, staker]: SignerWithAddress[] = await ethers.getSigners();
      const { deployer, discreteStakingRewards, tokenStaking, tokenReward } =
        await loadFixture(deployDiscreteStakingRewardsFixture);

      await mintAndStake(discreteStakingRewards, tokenStaking, staker);

      // Set new rewardIndex
      await mintAndUpdateRewardIndex(
        discreteStakingRewards,
        tokenReward,
        deployer
      );

      await expect(discreteStakingRewards.connect(staker).claim())
        .to.emit(discreteStakingRewards, "RewardsClaimed")
        .withArgs(staker.address, REWARD_AMOUNT);
    });

    it("transfers reward tokens from the contract to the staker", async function () {
      const [, staker]: SignerWithAddress[] = await ethers.getSigners();
      const { deployer, discreteStakingRewards, tokenStaking, tokenReward } =
        await loadFixture(deployDiscreteStakingRewardsFixture);

      await mintAndStake(discreteStakingRewards, tokenStaking, staker);

      // Set new rewardIndex
      await mintAndUpdateRewardIndex(
        discreteStakingRewards,
        tokenReward,
        deployer
      );

      const contractRewardTokensBeforeClaming: BigNumber =
        await tokenReward.balanceOf(discreteStakingRewards.address);
      const stakerRewardTokensBeforeClaming: BigNumber =
        await tokenReward.balanceOf(staker.address);

      await discreteStakingRewards.connect(staker).claim();

      const contractRewardTokensAfterClaming: BigNumber =
        await tokenReward.balanceOf(discreteStakingRewards.address);
      const stakerRewardTokensAfterClaming: BigNumber =
        await tokenReward.balanceOf(staker.address);

      assert.equal(
        contractRewardTokensBeforeClaming.toString(),
        REWARD_AMOUNT.toString()
      );
      assert.equal(stakerRewardTokensBeforeClaming.toString(), "0");
      assert.equal(contractRewardTokensAfterClaming.toString(), "0");
      assert.equal(
        stakerRewardTokensAfterClaming.toString(),
        REWARD_AMOUNT.toString()
      );
    });

    it("set staker earnings to zero", async function () {
      const [, staker]: SignerWithAddress[] = await ethers.getSigners();
      const { deployer, discreteStakingRewards, tokenStaking, tokenReward } =
        await loadFixture(deployDiscreteStakingRewardsFixture);

      await mintAndStake(discreteStakingRewards, tokenStaking, staker);

      // Set new rewardIndex
      await mintAndUpdateRewardIndex(
        discreteStakingRewards,
        tokenReward,
        deployer
      );

      await discreteStakingRewards.connect(staker).claim();

      const stakerEarnings: BigNumber =
        await discreteStakingRewards.calculateRewardsEarned(staker.address);

      assert.equal(stakerEarnings.toString(), "0");
    });

    it("reverts if the staker has no staked tokens", async function () {
      const [, staker, hacker]: SignerWithAddress[] = await ethers.getSigners();
      const { deployer, discreteStakingRewards, tokenStaking, tokenReward } =
        await loadFixture(deployDiscreteStakingRewardsFixture);

      await mintAndStake(discreteStakingRewards, tokenStaking, staker);

      // Set new rewardIndex
      await mintAndUpdateRewardIndex(
        discreteStakingRewards,
        tokenReward,
        deployer
      );

      await expect(
        discreteStakingRewards.connect(hacker).claim()
      ).to.be.revertedWithCustomError(
        discreteStakingRewards,
        "DiscreteStakingRewards__ZeroRewards"
      );
    });
  });
});
