import {
  GelatoRelay,
  CallWithSyncFeeERC2771Request,
} from "@gelatonetwork/relay-sdk";
import { deployments, ethers } from "hardhat";
import { IERC20 } from "../typechain";

import { BUSD_TOKEN, KMON_TOKEN } from "../shared/constants";

import assert from "assert";
import * as dotenv from "dotenv";
dotenv.config({ path: __dirname + "/.env" });

const PRIVATE_KEY = process.env.PRIVATE_KEY;
assert.ok(PRIVATE_KEY, "No PRIVATE_KEY in .env");

const main = async () => {
  const [deployer] = await ethers.getSigners();
  const chainId = await deployer.getChainId();

  const { address: counterAddress } = await deployments.get("Counter");
  const counter = await ethers.getContractAt("Counter", counterAddress);

  const maxFee = ethers.utils.parseEther("1000");
  const kmon = (await ethers.getContractAt("IERC20", KMON_TOKEN)) as IERC20;
  await kmon.approve(counter.address, maxFee);

  const { data } = await counter.populateTransaction.increment(
    maxFee,
    Math.floor(Date.now() / 1000) + 60
  );

  if (!data) throw new Error("Invalid transaction");

  const relay = new GelatoRelay();

  const request: CallWithSyncFeeERC2771Request = {
    target: counter.address,
    user: deployer.address,
    data: data,
    feeToken: BUSD_TOKEN,
    chainId: chainId,
    isRelayContext: true,
  };

  const wallet = new ethers.Wallet(PRIVATE_KEY);
  const { taskId } = await relay.callWithSyncFeeERC2771(request, wallet);

  console.log("https://api.gelato.digital/tasks/status/" + taskId);
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
