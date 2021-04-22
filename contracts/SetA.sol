pragma solidity >=0.4.22 <0.9.0;

contract SetA {

    uint public a;
    address public Relayer;


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
}
