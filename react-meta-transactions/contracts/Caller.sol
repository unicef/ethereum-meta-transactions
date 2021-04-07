pragma solidity >=0.6.8 <0.9.0;

import "hardhat/console.sol";


contract Caller {
    constructor() {
    }

    function forward(address destination, uint value, bytes calldata data) public {
        console.log("in forward");
        require(executeCall(destination, value, data), "Caller::problem in executeCall");
        emit Forwarded(destination, value, data);
    }

    event Forwarded (address destination, uint value, bytes data);

    function executeCall(address to, uint256 value, bytes memory data) internal returns (bool success) {
        console.log(string(data));
        assembly {
            success := call(gas(), to, value, add(data, 0x20), mload(data), 0, 0)
        }
    }

}
