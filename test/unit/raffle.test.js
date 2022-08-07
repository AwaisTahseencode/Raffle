const { network, ethers, getNamedAccounts, deployments }=require("hardhat")
const {assert,expect}=require("chai")
const {developmentChains,networkConfig}=require("../../helper-hardhat-config")
!developmentChains.includes(network.name)?describe.skip:describe("Raffle uint test",async()=>{
    //Global variables

   let raffle,vrfCoordinatorV2,chainId,deployer,entranceFee,interval,raffleContract
    beforeEach(async()=>{
        const {deployer}=await getNamedAccounts()
        await deployments.fixture(["all"])
         raffle =await ethers.getContract("Raffle",deployer)
         vrfCoordinatorV2=await ethers.getContract("VRFCoordinatorV2Mock",deployer)
        //  raffleContract = await ethers.getContract("Raffle",deployer) // Returns a new connection to the Raffle contract
        //       raffle = raffleContract.connect(player)
         chainId=network.config.chainId 
         entranceFee=ethers.utils.parseEther("0.01")
         interval=await raffle.getInterval()

    })
    //Checks whether the amount is enough or not
    it("entranceClearity",async()=>{
        await raffle.enterRaffle({value:entranceFee})
    })
    //first player
    it("first player",async()=>{
        await raffle.enterRaffle({value:entranceFee})
        deployer=(await getNamedAccounts()).deployer
        const player=await raffle.getPlayer(0)
        assert.equal(player,deployer) 
        })
    //Checking for the events to be fired 
    it("checking the events",async()=>{
        await expect(raffle.enterRaffle({value:entranceFee})).to.emit(raffle,"raffleEnter")
    })
    //writing the test for constructor 
    describe("constructor",async()=>{
        it("check the state of the raffle",async()=>{
            const raffleState=(await raffle.getRaffleState()).toString() 
            assert(raffleState,"0")
        })
    })
    //It doesnt allow the player when the raffle is in calculating state 
    it("It doesnt allow to enter",async()=>{
        await raffle.enterRaffle({value:entranceFee})
        await network.provider.send("evm_increaseTime",[interval.toNumber()+1])
        await network.provider.send("evm_mine",[])
        await raffle.performUpkeep([])
        await expect(raffle.enterRaffle({value:entranceFee}))
    })
    //get the total of the list/array
    it("check the array",async()=>{
        await raffle.enterRaffle({value:entranceFee})
        // deployer=(await getNamedAccounts()).deployer
        const totalPlayers=await raffle.numberOfPlayers()
        assert.equal(totalPlayers.toString(),"1")
    })
    //Checking the address of the first player
    describe("enterRaffle",async()=>{
        it("Entrance Fee",async()=>{
            await expect(raffle.enterRaffle()).to.be.revertedWith("Raffle__NotEnoughEthEntered")
        })
     })
    
     describe("checkUpkeep",()=>{
        it("checks if there is any player",async()=>{
            await network.provider.send("evm_increaseTime",[interval.toNumber()+1])
            await network.provider.send("evm_mine",[])
            const {upkeepNeeded}=await raffle.callStatic.checkUpkeep([])
            assert(!upkeepNeeded)
        })
        it("checks the interval of the lottery",async()=>{
            await raffle.enterRaffle({value:entranceFee})
            await network.provider.send("evm_increaseTime",[interval.toNumber()-1])
            await network.provider.send("evm_mine",[])
            const {upkeepNeeded}=await raffle.callStatic.checkUpkeep([])
            assert(!upkeepNeeded)
        })
        it("checks all conditions of checkUpkeep",async()=>{
            await raffle.enterRaffle({value:entranceFee})
            await network.provider.send("evm_increaseTime",[interval.toNumber()+1])
            await network.provider.send("evm_mine",[])
            const {upkeepNeeded}=await raffle.callStatic.checkUpkeep([])
            assert(upkeepNeeded)
        })
     })
     describe("performUpkeep",()=>{
        it("checks the performUp keep work when checkUpkeep is true",async()=>{
            await raffle.enterRaffle({value:entranceFee})
            await network.provider.send("evm_increaseTime",[interval.toNumber()+1])
            await network.provider.send("evm_mine",[])
            const performUpkeep=await raffle.performUpkeep([])
            assert(performUpkeep)
        })
        it("without true confirmation of checkUpkeep it will revert with an error",async()=>{
            await expect(raffle.performUpkeep([]))
        })
        it("change the raffle state emits the events , call the vrf coordinator",async()=>{
            await raffle.enterRaffle({value:entranceFee})
            await network.provider.send("evm_increaseTime",[ interval.toNumber() + 1])
            await network.provider.send("evm_mine",[])
            const transactionResponse=await raffle.performUpkeep([])
            const transactionReceipt=await transactionResponse.wait(1)
            const requestId= transactionReceipt.events[1].args.requestId
            const raffleSt =(await raffle.getRaffleState()).toString()
            assert(requestId.toString()>"0")
            assert.equal(raffleSt,"1")
        })
     })
     describe("fullfilRandomWords",()=>{
        beforeEach(async()=>{
            await raffle.enterRaffle({value:entranceFee})
            await network.provider.send("evm_increaseTime",[interval.toNumber() + 1])
            await network.provider.send("evm_mine",[])
        })
        it("it can only be called after performUpkeep",async()=>{
            await expect(vrfCoordinatorV2.fulfillRandomWords(0,raffle.address)).to.be.revertedWith("nonexistent request")
            await expect(vrfCoordinatorV2.fulfillRandomWords(1,raffle.address)).to.be.revertedWith("nonexistent request")
        })
        it("picks the winner,reset the array, send the money",async()=>{
          const accounts=await ethers.getSigners()
          const startingIndex=1
          const endingIndex=3
        //   let raffleContract
          for(let i=startingIndex;i<=endingIndex;i++){
            const accountConnectedRaffle=raffle.connect(accounts[i])
            await accountConnectedRaffle.enterRaffle({value:entranceFee})
        }
        const startingTimeStamp=await raffle.getLastTimeStamp()
        await new Promise (async(resolve,reject)=>{
            raffle.once("winnerPicked",async()=>{
                try {
                    console.log("Winner has been picked")
                    const recentWinner=await raffle.getRecentWinner()
                    console.log(recentWinner)
                    console.log(accounts[1])
                    console.log(accounts[2])
                    console.log(accounts[3])
                    console.log(accounts[1])
                    const endingBalance=await raffle.getBalance()
                    const winnerBalance=await accounts[1].getBalance()
                    const lastTimeStamp=await raffle.lastTimeStamp()
                    const raffleState=await raffle.getRaffleState()
                    // await expect(raffleContract.getPlayer(0)).to.be.reverted
                    assert.equal(recentWinner.toString(),accounts[1].address)
                    assert.equal(raffleState,0)
                    assert.equal(winnerBalance.toString(),startingBalance.add(entranceFee.mul(endingIndex).add(entranceFee)).toString())  
                    assert.equal(endingBalance.toNumber(),0)
                    assert(lastTimeStamp>startingTimeStamp)
                    
                    // done()
                    resolve()
                } catch (error) {
                    reject(error)
                }//end of try catch
            })
            await network.provider.send("eth_increaseTime",[interval.toNumber() + 1])
            await network.provider.send("evm_mine",[])
            const transactionResponse=await raffle.performUpkeep([])
            const transactionReceipt=await transactionResponse.wait(1)
            const startingBalance=await accounts[1].getBalance()
            await vrfCoordinatorV2Mock.fulfillRandomWords(
                transactionReceipt.events[1].args.requestId,
                raffle.address
            )
        })//end of Promise
            
        })//end of it
     })

})