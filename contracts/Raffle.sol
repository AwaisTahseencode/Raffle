//SPDX-License-Identifier:MIT
pragma solidity 0.8.8;
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/KeeperCompatibleInterface.sol";
//Errors
error Raffle__NotEnoughEthEntered();
error Raffle__notOpen();
error successTransactionError();
error Raffle__upkeepNotNeeded(uint256 balance,uint256 players,uint256 state);
//contract
contract Raffle is  VRFConsumerBaseV2,KeeperCompatibleInterface{
    //natSpec
    /**
    @title a sample project
    @author Awais Tahseen
    @notice This contract is for untemperable decentralised smart contract lottery
    @dev this implements chaiklink vrf v2 and chainlink keepers
    */ 
    //enums
    enum raffleState{
        OPEN,CALCULATING
    }
    //state Variables
    uint256 private immutable i_entranceFee;
    address payable [] private  funders;
    // VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
     VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    uint64 private immutable i_subId;
    bytes32 private immutable i_gasLane;//gaslane is same as keyHash
    uint16 private constant REQUEST_CONFIRMATION=3;
    uint32 private immutable i_callBackGasLimit;
    uint32 private constant RANDOM_WORDS=1;

//Lottery variables 
address private s_recentWinner;
raffleState private s_rafflePresentState;
uint256 private s_lastTimeStamp;
uint256 private immutable i_interval;
    //Events
    event raffleEnter(address indexed player);
    event raffleEnterWinner(uint256 indexed requestId);
    event winnerPicked(address indexed winner);
    //Constructor
    constructor(address vrfCoordinateV2,
    uint256 entranceFee,
    bytes32 gasLane,
    uint64 subid,
    uint32 callBackGasLimit,
    uint256 interval
            ) 
    VRFConsumerBaseV2(vrfCoordinateV2) {
        i_entranceFee=entranceFee;
        i_gasLane=gasLane;
        i_vrfCoordinator=VRFCoordinatorV2Interface(vrfCoordinateV2);
        i_subId=subid;
        i_callBackGasLimit=callBackGasLimit;
        //we can also say that s_rafflePresentState=raffleState(0);
        s_rafflePresentState=raffleState.OPEN;
        s_lastTimeStamp=block.timestamp;
        i_interval=interval;
    }
    function enterRaffle() public payable{
        if(msg.value<i_entranceFee){
        revert Raffle__NotEnoughEthEntered();

        }
        if(s_rafflePresentState!=raffleState.OPEN)
        {
            revert Raffle__notOpen();}
    funders.push(payable(msg.sender));
    emit raffleEnter(msg.sender);
    }
    //checkUpKeep and performUpKeep

    //we are making checkUpkeep function public instead of external so
    //our own SC call call it

    function checkUpkeep(bytes memory /*callData*/)public override
    returns (bool upkeepNeeded,bytes memory /*perform data*/ ){
        bool isOpen=(raffleState.OPEN==s_rafflePresentState);
        //for current time we use global variables like block.timestamp
        bool isTimePassed=((block.timestamp-s_lastTimeStamp)>i_interval);
        bool hasPlayers=(funders.length>0);
        bool hasBalance=(address(this).balance>0);
        //we'll return all bools as upkeepNeeded 
        upkeepNeeded=(isOpen && isTimePassed && hasBalance && hasPlayers);
        //perform data is something if we want the checkUpkey to perform something else for us
    }
    //we can change requestRandomWinners to performUpkeep
    //Request Random winners
function performUpkeep(bytes calldata /*performData */)external override{
    //i_vrfCoordinator will return a request id that who is requesting it so we can save it 
    // we have to check the condition in order to proceed further
    (bool upkeepNeeded,)=checkUpkeep("");
    //we ll pass some params in this error so other people know why this error is going on
    if(!upkeepNeeded)
    revert Raffle__upkeepNotNeeded(address(this).balance,funders.length,uint256(s_rafflePresentState));
    s_rafflePresentState=raffleState.OPEN;
    uint256 requestId= i_vrfCoordinator.requestRandomWords(
        i_gasLane,
        i_subId,
        REQUEST_CONFIRMATION,
        i_callBackGasLimit,
        RANDOM_WORDS
        //keyHash,subcriptionId,requestConfirmation,callBackGasLimit,numWords
    );
        emit raffleEnterWinner(requestId);
}
function fulfillRandomWords(uint256 /*requestId*/,uint256[] memory randomWords) internal override {
    s_rafflePresentState=raffleState.OPEN;
    uint256 indexOfWinner=randomWords[0]%funders.length;
    address payable recentWinner=funders[indexOfWinner];
    s_recentWinner=recentWinner;
    (bool success,)=recentWinner.call{value:address(this).balance}("");
    if(!success)
    revert successTransactionError();
    //after picking a player we have to reset the array so for that
    funders = new address payable[](0);
    s_lastTimeStamp=block.timestamp;
    emit winnerPicked(recentWinner);
}
//pure/view functions
function entranceFeeRet()public view returns (uint256){
    return i_entranceFee;
}
function getRecentWinner() public view returns(address){
    return s_recentWinner;
}
function getPlayer(uint index )public view returns (address)
{
    return funders[index];
}
function getRaffleState() public view returns (raffleState){
return s_rafflePresentState;
}
//if the variable is contant so function will not read it from the storage then its better to make it pure
function getNumWords() public pure returns (uint256){
    return RANDOM_WORDS;
}
function numberOfPlayers() public view returns (uint256){
    return funders.length;
}
function getLastTimeStamp() public view returns(uint256){
    return s_lastTimeStamp;
}
function getRequestConfirmations() public pure returns(uint256){
return REQUEST_CONFIRMATION;
}
function getInterval() public view returns(uint256){
    return i_interval;
}
}

