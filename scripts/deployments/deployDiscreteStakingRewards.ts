// Packages
import * as fs from "fs";
import * as path from "path";
import { ethers, network } from "hardhat";

// Functions
import { log, verify } from "../../helper-functions";

// Data
import {
  developmentChains,
  VERIFICATION_BLOCK_CONFIRMATIONS,
} from "../../helper-hardhat-config";

// Types
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  DiscreteStakingRewards,
  DiscreteStakingRewards__factory,
} from "../../typechain-types";
import { BigNumber } from "ethers";

// ---

/**
 * Type of the deployed contract that will be stored in deployed-contracts.json file
 *
 * example:
 *  {
 *    "hardhat": {
 *      "contractName": "contractAddress"
 *    }
 *  }
 */
type DeployedContracts = {
  [key: string]: {
    [key: string]: string;
  };
};

/**
 * Deploy Staking Rewards Contract
 *
 * @param chainId the Id of the network we will deploy on it
 * @param tokenStaking the address of the staking ERC20 token
 * @param tokenReward the address of the reward ERC20 token
 * @returns the deployed contract
 */
async function deployDiscreteStakingRewards(
  chainId: number,
  tokenStaking: string,
  tokenReward: string
) {
  const [deployer]: SignerWithAddress[] = await ethers.getSigners();

  if (developmentChains.includes(network.name)) {
    // Deploy MOCKS if existed
    // You will use chainId to get info of the chain from hardhat-helper-config file
  } else {
    // Do additional thing in case its not a testnet
  }

  // Deploying The Contract
  log(`Deploying contract with the account: ${deployer.address}`);
  const discreteStakingRewardsFactory: DiscreteStakingRewards__factory =
    await ethers.getContractFactory("DiscreteStakingRewards", deployer);
  log("Deploying Contract...");
  const discreteStakingRewards: DiscreteStakingRewards =
    await discreteStakingRewardsFactory.deploy(tokenStaking, tokenReward);
  await discreteStakingRewards.deployed();

  log(`StakingRewards deployed to: ${discreteStakingRewards.address}`);
  log("", "separator");

  if (!developmentChains.includes(network.name)) {
    // Verify Contract if it isnt in a development chain
    log("Verifying Contract", "title");
    await discreteStakingRewards.deployTransaction.wait(
      VERIFICATION_BLOCK_CONFIRMATIONS
    );
    await verify(discreteStakingRewards.address, [tokenStaking, tokenReward]);
    log("verified successfully");
  }

  // Storing contract address to connect to it later
  log("Storing contract address", "title");
  const parentDir: string = path.resolve(__dirname, "../../");
  const deployedContractsPath: string = path.join(
    parentDir,
    "deployed-contracts.json"
  );
  const oldContracts: DeployedContracts = JSON.parse(
    fs.readFileSync(deployedContractsPath, "utf8")
  );

  // Add the contract to the network we are deploying on it
  if (!oldContracts[network.name]) {
    oldContracts[network.name] = {};
  }
  oldContracts[network.name].DiscreteStakingRewards =
    discreteStakingRewards.address;
  // Save data in our deployed-contracts file
  fs.writeFileSync(
    deployedContractsPath,
    JSON.stringify(oldContracts, null, 2)
  );
  log("Stored Succesfully");
  log("", "separator");
  return discreteStakingRewards;
}

export default deployDiscreteStakingRewards;
