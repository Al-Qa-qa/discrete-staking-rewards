import { ethers, network } from "hardhat";
import jsonContracts from "../deployed-contracts.json";
import {
  DiscreteStakingRewards,
  TokenReward,
  TokenStaking,
} from "../typechain-types";
import { REWARD_AMOUNT, STAKING_AMOUNT } from "../helper-hardhat-config";
import { BigNumber } from "ethers";
import { ContractTransaction, ContractReceipt } from "ethers/src.ts/ethers";

// ---

/*
  Make new staking 
*/

async function claimReward() {
  const [deployer, staker, staker2] = await ethers.getSigners();
  const networkName: string = network.name;
  const contracts = Object(jsonContracts);
  if (!contracts[networkName].DiscreteStakingRewards) {
    throw new Error("Contract is not deployed yet");
  }
  if (networkName === "hardhat") {
    throw new Error("Can't run scripts to hardhat network deployed contract");
  }
  const discreteStakingRewards: DiscreteStakingRewards =
    await ethers.getContractAt(
      "DiscreteStakingRewards",
      contracts[networkName].DiscreteStakingRewards,
      deployer
    );

  const tokenReward: TokenReward = await ethers.getContractAt(
    "TokenReward",
    contracts[networkName].TokenReward,
    deployer
  );

  try {
    const userReward = await discreteStakingRewards.calculateRewardsEarned(
      staker2.address
    );
    console.log(`Staker rewards: ${ethers.utils.formatUnits(userReward)} RT`);
    // Rewards
    const claimTx: ContractTransaction = await discreteStakingRewards
      .connect(staker2)
      .claim();
    const claimTxReceipt: ContractReceipt = await claimTx.wait(1);

    console.log(claimTxReceipt);
    console.log(claimTxReceipt.logs[0].data);

    const stakerBalance: BigNumber = await discreteStakingRewards.balanceOf(
      staker.address
    );
    const totalSupply: BigNumber = await discreteStakingRewards.totalSupply();
    const stakerRewardTokens: BigNumber = await tokenReward.balanceOf(
      staker2.address
    );

    console.log(`stakerBalance: ${stakerBalance}`);
    console.log(`totalSupply: ${totalSupply}`);
    console.log(`Rewards taken: ${stakerRewardTokens}`);
  } catch (err) {
    console.log(err);
    console.log("----------------------");
    throw new Error(`Failed to stake tokens`);
  }

  return discreteStakingRewards;
}

claimReward()
  .then((discreteStakingRewards) => {
    console.log(`Claimed reward tokens successfully`);
    process.exit(0);
  })
  .catch((err) => {
    console.log(err);
    process.exit(1);
  });
