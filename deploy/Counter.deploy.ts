import { deployments, getNamedAccounts } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { PANCAKE_ROUTER, KMON_TOKEN } from "../shared/constants";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log(
    `Deploying Counter to ${hre.network.name}. Hit ctrl + c to abort`
  );

  await deploy("Counter", {
    from: deployer,
    args: [PANCAKE_ROUTER, KMON_TOKEN],
    log: true,
  });
};

func.tags = ["Counter"];

export default func;
