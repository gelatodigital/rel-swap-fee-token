// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {
    GelatoRelayContext
} from "@gelatonetwork/relay-context/contracts/GelatoRelayContext.sol";

import {
    ERC20Permit
} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

import {IRouter} from "./interfaces/IRouter.sol";

contract CounterPermit is GelatoRelayContext {
    mapping(address => uint256) public counter;
    IRouter public router;
    ERC20Permit public token;

    event IncrementCounter(uint256 newCounterValue, address msgSender);

    constructor(IRouter _router, ERC20Permit _token) {
        router = _router;
        token = _token;
    }

    function increment(
        address owner,
        uint256 maxFee,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external onlyGelatoRelay {
        _swapAndTransferRelayFee(
            owner,
            _getFeeCollector(),
            _getFeeToken(),
            _getFee(),
            maxFee,
            deadline,
            v,
            r,
            s
        );

        counter[owner]++;
        emit IncrementCounter(counter[owner], owner);
    }

    function _swapAndTransferRelayFee(
        address owner,
        address collector,
        address feeToken,
        uint256 fee,
        uint256 maxFee,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) internal {
        token.permit(owner, address(this), maxFee, deadline, v, r, s);

        address[] memory path = new address[](2);
        path[0] = address(token);
        path[1] = feeToken;

        uint256 amountIn = router.getAmountsIn(fee, path)[0];

        require(
            amountIn <= maxFee,
            "Counter._swapAndTransferRelayFee: amount required exceeds max fee"
        );

        token.transferFrom(owner, address(this), amountIn);
        token.approve(address(router), amountIn);

        router.swapTokensForExactTokens(
            fee,
            amountIn,
            path,
            collector,
            deadline
        );
    }
}
