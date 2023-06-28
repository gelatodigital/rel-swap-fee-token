// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {
    GelatoRelayContextERC2771
} from "@gelatonetwork/relay-context/contracts/GelatoRelayContextERC2771.sol";

import {IRouter} from "./interfaces/IRouter.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Counter is GelatoRelayContextERC2771 {
    mapping(address => uint256) public counter;
    IRouter public router;
    IERC20 public token;

    event IncrementCounter(uint256 newCounterValue, address msgSender);

    constructor(IRouter _router, IERC20 _token) {
        router = _router;
        token = _token;
    }

    function increment(
        uint256 maxFee,
        uint256 deadline
    ) external onlyGelatoRelayERC2771 {
        address msgSender = _getMsgSender();
        counter[msgSender]++;

        _swapAndTransferRelayFee(
            msgSender,
            _getFeeCollector(),
            _getFeeToken(),
            _getFee(),
            maxFee,
            deadline
        );

        emit IncrementCounter(counter[msgSender], msgSender);
    }

    function _swapAndTransferRelayFee(
        address from,
        address collector,
        address feeToken,
        uint256 fee,
        uint256 maxFee,
        uint256 deadline
    ) internal {
        address[] memory path = new address[](2);
        path[0] = address(token);
        path[1] = feeToken;

        uint256 amountIn = router.getAmountsIn(fee, path)[0];

        require(
            amountIn <= maxFee,
            "Counter._swapAndTransferRelayFee: amount required exceeds max fee"
        );

        token.transferFrom(from, address(this), amountIn);
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
