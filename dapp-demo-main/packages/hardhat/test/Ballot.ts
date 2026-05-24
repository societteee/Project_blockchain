import { expect } from "chai";
import { ethers as hardhatEthers } from "hardhat";

function formatBytes32String(text: string) {
  const bytes = Buffer.from(text, "utf8");
  if (bytes.length > 32) {
    throw new Error("String too long for bytes32");
  }
  const padded = Buffer.alloc(32);
  bytes.copy(padded);
  return `0x${padded.toString("hex")}`;
}

describe("Ballot", function () {
  let ballot: any;
  let candidates: any[];
  let chairman: any, acc1: any, acc2: any, acc3: any;

  beforeEach(async function () {
    candidates = [
      formatBytes32String("Candidate A"),
      formatBytes32String("Candidate B"),
      formatBytes32String("Candidate C")
    ];
    
    const Ballot = await hardhatEthers.getContractFactory("Ballot");
    ballot = await Ballot.deploy(candidates);
    await ballot.waitForDeployment();
    
    [chairman, acc1, acc2, acc3] = await hardhatEthers.getSigners();
  });

  it("should deploy contract with correct initial state", async function () {
    expect(await ballot.chairperson()).to.equal(chairman.address);
    expect(await ballot.getProposalCount()).to.equal(3);
    
    const proposal0 = await ballot.getProposal(0);
    expect(proposal0.name).to.equal(candidates[0]);
    expect(proposal0.voteCount).to.equal(0);
  });

  it("test vote and winner (write function test)", async function () {
    await ballot.giveRightToVote(acc1.address);
    await ballot.connect(acc1).vote(1);
    
    expect(await ballot.winningProposal()).to.equal(1);
    expect(await ballot.winnerName()).to.equal(candidates[1]);
  });

  it("test delegate", async function () {
    await ballot.giveRightToVote(acc1.address);
    await ballot.giveRightToVote(acc2.address);
    
    await ballot.connect(acc1).delegate(acc2.address);
    await ballot.connect(acc2).vote(0);
    
    expect(await ballot.winningProposal()).to.equal(0);
  });

  it("should emit VoteCast event when voting", async function () {
    await ballot.giveRightToVote(acc1.address);
    
    await expect(ballot.connect(acc1).vote(2))
      .to.emit(ballot, "VoteCast")
      .withArgs(acc1.address, 2, 1);
  });

  it("should emit RightToVoteGranted event", async function () {
    await expect(ballot.giveRightToVote(acc1.address))
      .to.emit(ballot, "RightToVoteGranted")
      .withArgs(acc1.address);
  });

  it("should fail when non-chairperson tries to give right to vote (require test)", async function () {
    await expect(ballot.connect(acc1).giveRightToVote(acc2.address))
      .to.be.revertedWith("Only chairperson can call this function");
  });

  it("should fail when voting without right (require test)", async function () {
    await expect(ballot.connect(acc1).vote(0))
      .to.be.revertedWith("Has no right to vote");
  });

  it("should fail when voting twice (require test)", async function () {
    await ballot.giveRightToVote(acc1.address);
    await ballot.connect(acc1).vote(0);
    
    await expect(ballot.connect(acc1).vote(1))
      .to.be.revertedWith("Already voted.");
  });

  it("should get voter info correctly", async function () {
    await ballot.giveRightToVote(acc1.address);
    await ballot.connect(acc1).vote(1);
    
    const voterInfo = await ballot.getVoterInfo(acc1.address);
    expect(voterInfo.weight).to.equal(1);
    expect(voterInfo.voted).to.equal(true);
    expect(voterInfo.voteIndex).to.equal(1);
  });

  it("should get total votes correctly", async function () {
    await ballot.giveRightToVote(acc1.address);
    await ballot.giveRightToVote(acc2.address);
    
    await ballot.connect(acc1).vote(0);
    await ballot.connect(acc2).vote(1);
    
    expect(await ballot.getTotalVotes()).to.equal(2);
  });

  it("should use voteWithWeight function", async function () {
    await ballot.giveRightToVote(acc1.address);
    
    await expect(ballot.connect(acc1).voteWithWeight(2))
      .to.emit(ballot, "VoteCast")
      .withArgs(acc1.address, 2, 1);
    
    const proposal = await ballot.getProposal(2);
    expect(proposal.voteCount).to.equal(1);
  });
});