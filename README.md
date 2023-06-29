# Relay Swap Unsupported to Supported Fee Token

This project demonstrates synchronous fee payment (``callWithSyncFee``/``callWithSyncFeeERC2771``) using an unsupported fee token.
Rather than using ``_transferRelayFee``, it introduces [``_swapAndTransferRelayFee``](https://github.com/gelatodigital/rel-swap-fee-token/blob/main/contracts/Counter.sol#L42-L72) which swaps the unsupported token to a supported fee token using any Uniswap-based router before transferring it to the fee collector.

> **Note**  
> Query the API for a list of supported tokens.  
> https://api.gelato.digital/oracles/{chainId}/paymentTokens

## Allowance
Before execution, the target contract must be approved sufficient spending of the unsupported token.
This can be done in one of two ways:

1. Calling ``approve`` on-chain
2. Off-chain ``permit`` signature

This project currently demonstrates the first, by calling ``approve`` before relaying.
The second option is preferred if the token is ``ERC20Permit`` compatible since spending can be permitted off-chain without requiring an additional transaction.

> **Note**  
> If using off-chain permit, use ``callWithSyncFee`` rather than ``callWithSyncFeeERC2771`` since authentication is already handled by the permit signature.
> This is demonstrated in [Gasless minting using USDC](https://github.com/gelatodigital/rel-gasless-nft-usdc-example).

## Testing
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

## Deployment
1. Install dependencies
   ```
   yarn install
   ```
2. Compile smart contracts
   ```
   yarn run hardhat compile
   ```
3. Edit ``.env``
   ```
   cp .env.example .env
   ```
4. Deploy contracts
   ```
   yarn run hardhat deploy --network bsc
   ```
5. Relay the transaction
   ```
   yarn run hardhat run scripts/relay.ts --network bsc
   ```
