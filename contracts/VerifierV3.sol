pragma solidity >=0.4.22 <0.9.0;

interface Storage {
  function getA() external returns(uint256);
  function setA(uint256 a1) external returns(uint256);
  function setAForOwner(uint256 a1, address ownerAddress) external returns(uint256);
}

contract VerifierV3 {
  Storage public StorageContract;
  
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

  /* Examples of Execution */

  function updateStorage(uint256 data) public returns (uint256) {    
    StorageContract.setA(data);

    return StorageContract.getA();    
  }

  function updateStorageForOwner(uint256 data, uint256 nonce, bytes32 hash, uint8 v, bytes32 r, bytes32 s) public returns (uint256) {
    address user = verifySignatureAddress(data, nonce, hash, v, r, s);

    nonces[user][nonce] = true;

    StorageContract.setAForOwner(data, user);

    return StorageContract.getA();    
  }

  function getStorageValue() public returns (uint256) {
    return StorageContract.getA();
  }

  /*

  Arbitrary calls can be made using 
  address Contract = "0x....";

  Contract.call(data);

  Where data is an encoding of functionName, param types and args
  */
}
