import { CallWithSyncFeeERC2771Request } from "@gelatonetwork/relay-sdk";
import { setBalance } from "@nomicfoundation/hardhat-network-helpers";
import { deployments, ethers } from "hardhat";
import { Counter, IERC20 } from "../typechain";
import { expect } from "chai";

import {
  BUSD_TOKEN,
  FEE_COLLECTOR,
  GELATO_RELAY_ERC2771,
  KMON_TOKEN,
  KMON_SAFE,
} from "../shared/constants";

// emulates behaviour locally
// https://github.com/gelatodigital/rel-example-unit-tests
const callWithSyncFeeERC2771 = async (
  request: CallWithSyncFeeERC2771Request
) => {
  const fee = ethers.utils.parseEther("1");

  const data = ethers.utils.solidityPack(
    ["bytes", "address", "address", "uint256", "address"],
    [request.data, FEE_COLLECTOR, request.feeToken, fee, request.user]
  );

  const feeToken = (await ethers.getContractAt(
    "IERC20",
    request.feeToken
  )) as IERC20;

  const gelato = await ethers.getImpersonatedSigner(GELATO_RELAY_ERC2771);

  await setBalance(gelato.address, ethers.utils.parseEther("1"));

  const balanceBefore = await feeToken.balanceOf(FEE_COLLECTOR);
  await gelato.sendTransaction({ to: request.target, data });
  const balanceAfter = await feeToken.balanceOf(FEE_COLLECTOR);

  if (balanceAfter.toBigInt() - balanceBefore.toBigInt() < fee.toBigInt())
    throw new Error("Insufficient relay fee");
};

describe("Counter", () => {
  let counter: Counter;

  before(async () => {
    await deployments.fixture();

    const { address: counterAddress } = await deployments.get("Counter");

    counter = (await ethers.getContractAt(
      "Counter",
      counterAddress
    )) as Counter;
  });

  it("increment", async () => {
    const [deployer] = await ethers.getSigners();

    const maxFee = ethers.utils.parseEther("1000");
    const kmon = (await ethers.getContractAt("IERC20", KMON_TOKEN)) as IERC20;

    // transfer from safe to deployer
    const kmonSafe = await ethers.getImpersonatedSigner(KMON_SAFE);
    await kmon.connect(kmonSafe).transfer(deployer.address, maxFee);

    // deployer approve counter to spend fee
    await kmon.connect(deployer).approve(counter.address, maxFee);

    const { data } = await counter.populateTransaction.increment(
      maxFee,
      Math.floor(Date.now() / 1000) + 60
    );

    if (!data) throw new Error("Invalid transaction");

    const request: CallWithSyncFeeERC2771Request = {
      target: counter.address,
      user: deployer.address,
      data: data!,
      feeToken: BUSD_TOKEN,
      chainId: 56, // BSC
      isRelayContext: true,
    };

    const counterBefore = await counter.counter(deployer.address);
    await callWithSyncFeeERC2771(request);
    const counterAfter = await counter.counter(deployer.address);

    expect(counterAfter.toBigInt() - counterBefore.toBigInt()).to.equal(1n);
  });
});
