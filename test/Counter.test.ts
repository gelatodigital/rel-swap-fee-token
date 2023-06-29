import { CallWithSyncFeeERC2771Request } from "@gelatonetwork/relay-sdk";
import { BUSD_TOKEN, KMON_TOKEN, KMON_SAFE } from "../src/constants";
import { callWithSyncFeeERC2771 } from "../src/__mock__/relay-sdk";
import { deployments, ethers } from "hardhat";
import { Counter, IERC20 } from "../typechain";
import { expect } from "chai";

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
      data: data,
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
