// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
import { network, run } from "hardhat";

import deployTokenStaking from "./deployTokenStaking";
import deployTokenReward from "./deployTokenReward";
import deployDiscreteStakingRewards from "./deployDiscreteStakingRewards";
import { log } from "../../helper-functions";
import { TokenStaking, TokenReward } from "../../typechain-types";

// ---------

async function main() {
  await run("compile");
  const chainId = network.config.chainId!;

  log(
    `Deploying into network ${network.name} with chainId: ${chainId}`,
    "title"
  );
  const tokenStaking: TokenStaking = await deployTokenStaking(chainId);
  log(`Deployed TokenStaking contract successfully`);
  log("", "separator");
  const tokenReward: TokenReward = await deployTokenReward(chainId);
  log(`Deployed TokenReward contract successfully`);
  log("", "separator");

  await deployDiscreteStakingRewards(
    chainId,
    tokenStaking.address,
    tokenReward.address
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
