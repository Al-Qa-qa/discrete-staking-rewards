import { ethers, network } from "hardhat";
import jsonContracts from "../deployed-contracts.json";
import { DiscreteStakingRewards, TokenReward } from "../typechain-types";
import { REWARD_AMOUNT } from "../helper-hardhat-config";
// ---

/*
  Make new staking 
*/

async function listStake() {
  const [deployer] = await ethers.getSigners();
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
    // Mint some tokens to the deployer
    await tokenReward.mint(REWARD_AMOUNT);
    await tokenReward.approve(discreteStakingRewards.address, REWARD_AMOUNT);

    // Give rewards to the stakers
    await discreteStakingRewards.updateRewardIndex(REWARD_AMOUNT);
  } catch (err) {
    console.log(err);
    console.log("----------------------");
    throw new Error(`Failed to Add Rewards`);
  }

  return discreteStakingRewards;
}

listStake()
  .then((discreteStakingRewards) => {
    console.log(`Rewards added successfully`);
    process.exit(0);
  })
  .catch((err) => {
    console.log(err);
    process.exit(1);
  });
