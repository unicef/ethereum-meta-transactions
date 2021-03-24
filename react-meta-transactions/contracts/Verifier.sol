pragma solidity >=0.6.8 <0.9.0;

// this Verifier contract was heavily inspired by https://github.com/austintgriffith/bouncer-proxy/blob/master/BouncerProxy/BouncerProxy.sol

contract Verifier {
    //whitelist the deployer so they can whitelist others
    constructor() {
        whitelist[msg.sender] = true;
    }
    //to avoid replay
    mapping(address => uint) public nonce;
    // allow for third party metatx account to make transactions through this
    // contract like an identity but make sure the owner has whitelisted the tx
    mapping(address => bool) public whitelist;
    function updateWhitelist(address _account, bool _value) public returns(bool) {
        require(whitelist[msg.sender],"Verifier::updateWhitelist Account Not Whitelisted");
        whitelist[_account] = _value;
        emit UpdateWhitelist(_account,_value);
        return true;
    }
    event UpdateWhitelist(address _account, bool _value);
    // copied from https://github.com/uport-project/uport-identity/blob/develop/contracts/Proxy.sol

    function getHash(address signer, address destination, uint value, bytes memory data) public view returns(bytes32){
        return keccak256(abi.encodePacked(address(this), signer, destination, value, data, nonce[signer]));
    }


    // original forward function copied from https://github.com/uport-project/uport-identity/blob/develop/contracts/Proxy.sol
    function forward(bytes memory sig, address signer, address destination, uint value, bytes memory data) public {
        require(whitelist[msg.sender],"Verifier::updateWhitelist Account Not Whitelisted");
        //the hash contains all of the information about the meta transaction to be called
        bytes32 _hash = getHash(signer, destination, value, data);
        //increment the hash so this tx can't run again
        nonce[signer]++;
        //this makes sure signer signed correctly AND signer is a valid bouncer
        require(MessageIsSigned(signer,_hash,sig),"Verifier::forwarded message is not signed correctly");
        //make sure the signer pays in whatever token (or ether) the sender and signer agreed to
        // or skip this if the sender is incentivized in other ways and there is no need for a token
        //execute the transaction with all the given parameters
        require(executeCall(destination, value, data), "Verifier::problem in executeCall");
        emit Forwarded(sig, signer, destination, value, data, _hash);
    }
    // when some frontends see that a tx is made from a bouncerproxy, they may want to parse through these events to find out who the signer was etc
    event Forwarded (bytes sig, address signer, address destination, uint value, bytes data, bytes32 _hash);

    // copied from https://github.com/uport-project/uport-identity/blob/develop/contracts/Proxy.sol
    // which was copied from GnosisSafe
    // https://github.com/gnosis/gnosis-safe-contracts/blob/master/contracts/GnosisSafe.sol
    function executeCall(address to, uint256 value, bytes memory data) internal returns (bool success) {
        assembly {
            success := call(gas(), to, value, add(data, 0x20), mload(data), 0, 0)
        }
    }

    //borrowed from OpenZeppelin's ESDA stuff:
    //https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/cryptography/ECDSA.sol
    function recoverSigner(bytes32 _hash, bytes memory _signature) internal pure returns (address){
        bytes32 r;
        bytes32 s;
        uint8 v;
        // Check the signature length
        if (_signature.length != 65) {
            return address(0);
        }
        // Divide the signature in r, s and v variables
        // ecrecover takes the signature parameters, and the only way to get them
        // currently is to use assembly.
        // solium-disable-next-line security/no-inline-assembly
        assembly {
            r := mload(add(_signature, 32))
            s := mload(add(_signature, 64))
            v := byte(0, mload(add(_signature, 96)))
        }
        // Version of signature should be 27 or 28, but 0 and 1 are also possible versions
        if (v < 27) {
            v += 27;
        }
        // If the version is correct return the signer address
        if (v != 27 && v != 28) {
            return address(0);
        } else {
            // solium-disable-next-line arg-overflow
            return ecrecover(keccak256(
                    abi.encodePacked("\x19Ethereum Signed Message:\n32", _hash)
                ), v, r, s);
        }
    }

    function MessageIsSigned(address signer, bytes32 _hash, bytes memory _signature) internal pure returns (bool){
        return recoverSigner(_hash,_signature) == signer ;
    }
}
