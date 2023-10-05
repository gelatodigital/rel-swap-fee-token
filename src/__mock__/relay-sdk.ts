import { setBalance } from "@nomicfoundation/hardhat-network-helpers";
import { IERC20 } from "../../typechain";
import { ethers } from "hardhat";

import {
  CallWithSyncFeeRequest,
  CallWithSyncFeeERC2771Request,
} from "@gelatonetwork/relay-sdk";

import {
  FEE_COLLECTOR,
  GELATO_RELAY,
  GELATO_RELAY_ERC2771,
} from "../constants";

/**
 * Emulates relay behaviour locally
 * https://github.com/gelatodigital/rel-example-unit-tests
 */

export const callWithSyncFeeERC2771 = async (
  request: CallWithSyncFeeERC2771Request
) => {
  const fee = ethers.parseEther("1");

  const data = ethers.solidityPacked(
    ["bytes", "address", "address", "uint256", "address"],
    [request.data, FEE_COLLECTOR, request.feeToken, fee, request.user]
  );

  await internalCallWithSyncFee(
    GELATO_RELAY_ERC2771,
    request.target,
    data,
    BigInt(fee),
    request.feeToken
  );
};

export const callWithSyncFee = async (request: CallWithSyncFeeRequest) => {
  const fee = ethers.parseEther("1");

  const data = ethers.solidityPacked(
    ["bytes", "address", "address", "uint256"],
    [request.data, FEE_COLLECTOR, request.feeToken, fee]
  );

  await internalCallWithSyncFee(
    GELATO_RELAY,
    request.target,
    data,
    BigInt(fee),
    request.feeToken
  );
};

const internalCallWithSyncFee = async (
  from: string,
  to: string,
  data: string,
  fee: bigint,
  feeToken: string
) => {
  const token = (await ethers.getContractAt(
    "IERC20",
    feeToken
  )) as unknown as IERC20;

  const gelato = await ethers.getImpersonatedSigner(from);

  await setBalance(gelato.address, ethers.parseEther("1"));

  const balanceBefore = await token.balanceOf(FEE_COLLECTOR);
  await gelato.sendTransaction({ to, data });
  const balanceAfter = await token.balanceOf(FEE_COLLECTOR);

  if (BigInt(balanceAfter) - BigInt(balanceBefore) < fee)
    throw new Error("Insufficient relay fee");
};
