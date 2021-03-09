pragma solidity >=0.4.22 <0.9.0;

contract SetA {

    uint a;

    constructor() public{
        a=1;
    }

    function getA() public view returns(uint){
        return a;
    }

    function setA(uint a1) public payable returns(uint){
        a=a1;
        return a;
    }
}
