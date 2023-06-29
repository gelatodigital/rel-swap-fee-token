import { deployments, getNamedAccounts } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import { PANCAKE_ROUTER, PLAY_TOKEN } from "../src/constants";

const func: DeployFunction = async () => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  await deploy("CounterPermit", {
    from: deployer,
    args: [PANCAKE_ROUTER, PLAY_TOKEN],
  });
};

func.tags = ["CounterPermit"];

export default func;
