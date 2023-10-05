import { setBalance } from "@nomicfoundation/hardhat-network-helpers";
import { BUSD_TOKEN, PLAY_TOKEN, PLAY_SAFE } from "../src/constants";
import { CallWithSyncFeeRequest } from "@gelatonetwork/relay-sdk";
import { callWithSyncFee } from "../src/__mock__/relay-sdk";
import { deployments, ethers } from "hardhat";
import { CounterPermit, ERC20Permit } from "../typechain";
import { signPermit } from "../src/signature";
import { expect } from "chai";
import { Contract } from "ethers";

describe("CounterPermit", () => {
  let counter: CounterPermit;

  before(async () => {
    await deployments.fixture();

    const { address: counterAddress } = await deployments.get("CounterPermit");

    counter = (await ethers.getContractAt(
      "CounterPermit",
      counterAddress
    )) as unknown as CounterPermit;
  });

  it("increment", async () => {
    const [deployer] = await ethers.getSigners();

    const maxFee = ethers.parseEther("30");
    const play = (await ethers.getContractAt(
      "ERC20Permit",
      PLAY_TOKEN
    )) as unknown as ERC20Permit;

    // transfer from safe to deployer
    await setBalance(PLAY_SAFE, ethers.parseEther("1"));
    const playSafe = await ethers.getImpersonatedSigner(PLAY_SAFE);
    await play.connect(playSafe).transfer(deployer.address, maxFee);

    // sign permit signature
    const deadline = Math.floor(Date.now() / 1000) + 60;

    const sig = await signPermit(
      deployer,
      play as unknown as Contract,
      BigInt(maxFee),
      counter.target as string,
      deadline,
      56 // BSC
    );

    if (!sig) throw new Error("Invalid signature");

    const { v, r, s } = sig;

    const { data } = await counter.increment.populateTransaction(
      deployer.address,
      maxFee,
      deadline,
      v,
      r,
      s
    );

    if (!data) throw new Error("Invalid transaction");

    const request: CallWithSyncFeeRequest = {
      target: counter.target as string,
      data: data,
      feeToken: BUSD_TOKEN,
      chainId: 56, // BSC
      isRelayContext: true,
    };

    const counterBefore = await counter.counter(deployer.address);
    await callWithSyncFee(request);
    const counterAfter = await counter.counter(deployer.address);

    expect(BigInt(counterAfter) - BigInt(counterBefore)).to.equal(1n);
  });
});
