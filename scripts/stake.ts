import { ethers, network } from "hardhat";
import jsonContracts from "../deployed-contracts.json";
import {
  DiscreteStakingRewards,
  TokenReward,
  TokenStaking,
} from "../typechain-types";
import { REWARD_AMOUNT, STAKING_AMOUNT } from "../helper-hardhat-config";
import { BigNumber } from "ethers";
// ---

/*
  Make new staking 
*/

async function stake() {
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

  const tokenStaking: TokenStaking = await ethers.getContractAt(
    "TokenStaking",
    contracts[networkName].TokenStaking,
    deployer
  );

  try {
    // Mint some tokens to the deployer
    await tokenStaking.connect(staker2).mint(REWARD_AMOUNT);
    await tokenStaking
      .connect(staker2)
      .approve(discreteStakingRewards.address, REWARD_AMOUNT);

    // Give rewards to the stakers
    await discreteStakingRewards.connect(staker2).stake(STAKING_AMOUNT);

    const stakerBalance: BigNumber = await discreteStakingRewards.balanceOf(
      staker.address
    );
    const totalSupply: BigNumber = await discreteStakingRewards.totalSupply();

    console.log(`stakerBalance: ${stakerBalance}`);
    console.log(`totalSupply: ${totalSupply}`);
  } catch (err) {
    console.log(err);
    console.log("----------------------");
    throw new Error(`Failed to stake tokens`);
  }

  return discreteStakingRewards;
}

stake()
  .then((discreteStakingRewards) => {
    console.log(`Staked successfully`);
    process.exit(0);
  })
  .catch((err) => {
    console.log(err);
    process.exit(1);
  });
