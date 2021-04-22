pragma solidity >=0.4.22 <0.9.0;

contract SetA {

    uint public a;
    address public Relayer;
    mapping (address => bool) public owners;


    modifier onlyRelayer() {
        require(msg.sender == Relayer);
        _;
    }

    constructor(uint defaultValue) public{
        a=defaultValue;
    }

    function setRelayer(address newRelayer) public {
        Relayer = newRelayer;
    }

    function getA() public view returns(uint){
        return a;
    }

    function setA(uint a1) public onlyRelayer returns(uint){
        a=a1;
        return a;
    }

    function setAForOwner(uint a1, address ownerAddress) public onlyRelayer returns (uint) {
        require(owners[ownerAddress]);
        a = a1;
        return a;
    }

    function setOwner(address newOwner) public {
        owners[newOwner] = true;
    }

    function isOwner(address checkOwner) public view returns (bool) {
        return owners[checkOwner];
    }
}
