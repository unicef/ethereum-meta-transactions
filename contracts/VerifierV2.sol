pragma solidity >=0.4.22 <0.9.0;

contract VerifierV2 {
    function recoverAddr(bytes32 msgHash, uint8 v, bytes32 r, bytes32 s) public pure returns (address) {
        bytes32 payloadHash = keccak256(abi.encode(msgHash));
        bytes32 messageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", payloadHash));
        return ecrecover(messageHash, v, r, s);
    }

    function isSigned(address _addr, bytes32 msgHash, uint8 v, bytes32 r, bytes32 s) public pure returns (bool) {
        bytes32 payloadHash = keccak256(abi.encode(msgHash));
        bytes32 messageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", payloadHash));
        return ecrecover(messageHash, v, r, s) == _addr;
    }
}
