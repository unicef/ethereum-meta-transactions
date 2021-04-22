pragma solidity >=0.4.22 <0.9.0;

interface Storage {
  function getA() external returns(uint256);
  function setA(uint256 a1) external returns(uint256);
}

contract VerifierV3 {
  Storage public StorageContract;
  /* 
    The function parameters are arbitrary and could be a more dynamic payload for dynamic function execution. 
    Assume:
    data = an erc721 token id 
    newOwner = address to set for token id owner 
    nonce = TODO map if nonce has been used yet or not, reject used nonces.
  */
  mapping (address => mapping (uint256 => bool)) nonces;

  constructor(address storageContract) public {
    StorageContract = Storage(storageContract);
  }

  function calcHash(uint256 data, uint256 nonce) public pure returns(bytes32) {
    return keccak256(abi.encodePacked(data, nonce));
  }

  function recoverSignerAddress(bytes32 hash, uint8 v, bytes32 r, bytes32 s) public pure returns (address signer) {
    bytes32 messageDigest = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
    return ecrecover(messageDigest, v, r, s);
  }

  function verifySignatureAddress(uint256 data, uint256 nonce, bytes32 hash, uint8 v, bytes32 r, bytes32 s) public view returns (address signer) {
    require(calcHash(data, nonce) == hash);
    address recoveredSigner = recoverSignerAddress(hash, v, r, s);    
    require(nonces[recoveredSigner][nonce] == false);
    return recoveredSigner;
  }

  function getStorageValue() public returns (uint256) {
    return StorageContract.getA();
  }

  function updateStorage(uint256 data, uint256 nonce, bytes32 hash, uint8 v, bytes32 r, bytes32 s) public returns (uint256) {
    //address user = verifySignatureAddress(data, nonce, hash, v, r, s);
    StorageContract.setA(data);

    return StorageContract.getA();    
  }

}
