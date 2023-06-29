# Relay Swap Unsupported to Supported Fee Token

This project demonstrates synchronous fee payment (``callWithSyncFee``/``callWithSyncFeeERC2771``) using an unsupported fee token.
Rather than using ``_transferRelayFee``, it introduces [``_swapAndTransferRelayFee``](https://github.com/gelatodigital/rel-swap-fee-token/blob/main/contracts/Counter.sol#L42-L72) which swaps the unsupported token to a supported fee token using any Uniswap-based router and transfers it to the fee collector.

> **Note**  
> Query the API for a list of supported tokens.  
> https://api.gelato.digital/oracles/{chainId}/paymentTokens

## Allowance
Before execution, the target contract must be approved sufficient spending of the unsupported token.  
This can be done in one of two ways:

1. Calling [``approve``](https://github.com/gelatodigital/rel-swap-fee-token/blob/main/test/Counter.test.ts#L33) on-chain
2. Signing an off-chain [``permit``](https://github.com/gelatodigital/rel-swap-fee-token/blob/main/test/CounterPermit.test.ts#L41-L48) signature

Both are demonstrated in [``Counter``](https://github.com/gelatodigital/rel-swap-fee-token/blob/main/contracts/Counter.sol) and [``CounterPermit``](https://github.com/gelatodigital/rel-swap-fee-token/blob/main/contracts/CounterPermit.sol) respectively.
The latter is preferred when dealing with ``ERC20Permit`` compatible tokens since spending can be permitted off-chain without requiring an additional transaction.

> **Note**  
> When using off-chain permit, ``callWithSyncFee`` is used rather than ``callWithSyncFeeERC2771``. This is because authentication is already handled by the permit signature.
> Refer to the [documentation](https://docs.gelato.network/developer-services/relay) for a more detailed comparison between the two.

## Quick Start
1. Install dependencies
   ```
   yarn install
   ```
2. Compile smart contracts
   ```
   yarn run hardhat compile
   ```
3. Run unit tests
   ```
   yarn run hardhat test
   ```
