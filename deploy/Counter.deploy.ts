import { deployments, getNamedAccounts } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import { PANCAKE_ROUTER, KMON_TOKEN } from "../src/constants";

const func: DeployFunction = async () => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  await deploy("Counter", {
    from: deployer,
    args: [PANCAKE_ROUTER, KMON_TOKEN],
  });
};

func.tags = ["Counter"];

export default func;
