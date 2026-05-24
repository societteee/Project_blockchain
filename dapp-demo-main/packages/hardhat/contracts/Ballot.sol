// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.19;

/** 
 * @title Ballot
 * @dev Implements voting process along with vote delegation
 */
contract Ballot {
   
    struct Voter {
        uint weight; // weight is accumulated by delegation
        bool voted;  // if true, that person already voted
        address delegate; // person delegated to
        uint vote;   // index of the voted proposal
    }

    struct Proposal {
        // If you can limit the length to a certain number of bytes, 
        // always use one of bytes1 to bytes32 because they are much cheaper
        bytes32 name;   // short name (up to 32 bytes)
        uint voteCount; // number of accumulated votes
    }

    address public chairperson;

    mapping(address => Voter) public voters;

    Proposal[] public proposals;
    
    // Событие для отслеживания голосования
    event VoteCast(address indexed voter, uint proposalIndex, uint weight);
    // Событие для отслеживания делегирования
    event VoteDelegated(address indexed from, address indexed to);
    // Событие для предоставления права голоса
    event RightToVoteGranted(address indexed voter);
    
    // Модификатор для проверки, что вызывающий является председателем
    modifier onlyChairperson() {
        require(msg.sender == chairperson, "Only chairperson can call this function");
        _;
    }
    
    // Модификатор для проверки, что голосующий имеет право голоса
    modifier hasRightToVote() {
        require(voters[msg.sender].weight > 0, "Has no right to vote");
        _;
    }

    /** 
     * @dev Create a new ballot to choose one of 'proposalNames'.
     * @param proposalNames names of proposals
     */
    constructor(bytes32[] memory proposalNames) {
        chairperson = msg.sender;
        voters[chairperson].weight = 1;

        for (uint i = 0; i < proposalNames.length; i++) {
            // 'Proposal({...})' creates a temporary
            // Proposal object and 'proposals.push(...)'
            // appends it to the end of 'proposals'.
            proposals.push(Proposal({
                name: proposalNames[i],
                voteCount: 0
            }));
        }
    }
    
    /** 
     * @dev Give 'voter' the right to vote on this ballot. May only be called by 'chairperson'.
     * @param voter address of voter
     */
    function giveRightToVote(address voter) public onlyChairperson {
        require(
            !voters[voter].voted,
            "The voter already voted."
        );
        require(voters[voter].weight == 0, "Voter already has right to vote");
        voters[voter].weight = 1;
        emit RightToVoteGranted(voter);
    }

    /**
     * @dev Delegate your vote to the voter 'to'.
     * @param to address to which vote is delegated
     */
    function delegate(address to) public hasRightToVote {
        Voter storage sender = voters[msg.sender];
        require(!sender.voted, "You already voted.");
        require(to != msg.sender, "Self-delegation is disallowed.");

        while (voters[to].delegate != address(0)) {
            to = voters[to].delegate;

            // We found a loop in the delegation, not allowed.
            require(to != msg.sender, "Found loop in delegation.");
        }
        sender.voted = true;
        sender.delegate = to;
        Voter storage delegate_ = voters[to];
        if (delegate_.voted) {
            // If the delegate already voted,
            // directly add to the number of votes
            proposals[delegate_.vote].voteCount += sender.weight;
        } else {
            // If the delegate did not vote yet,
            // add to her weight.
            delegate_.weight += sender.weight;
        }
        
        emit VoteDelegated(msg.sender, to);
    }

    /**
     * @dev Give your vote (including votes delegated to you) to proposal 'proposals[proposal].name'.
     * @param proposal index of proposal in the proposals array
     */
    function vote(uint proposal) public hasRightToVote {
        Voter storage sender = voters[msg.sender];
        require(!sender.voted, "Already voted.");
        require(proposal < proposals.length, "Invalid proposal index");
        sender.voted = true;
        sender.vote = proposal;

        proposals[proposal].voteCount += sender.weight;
        emit VoteCast(msg.sender, proposal, sender.weight);
    }

    /** 
     * @dev Computes the winning proposal taking all previous votes into account.
     * @return winningProposal_ index of winning proposal in the proposals array
     */
    function winningProposal() public view
            returns (uint winningProposal_)
    {
        uint winningVoteCount = 0;
        for (uint p = 0; p < proposals.length; p++) {
            if (proposals[p].voteCount > winningVoteCount) {
                winningVoteCount = proposals[p].voteCount;
                winningProposal_ = p;
            }
        }
    }

    /** 
     * @dev Calls winningProposal() function to get the index of the winner contained in the proposals array and then
     * @return winnerName_ the name of the winner
     */
    function winnerName() public view
            returns (bytes32 winnerName_)
    {
        winnerName_ = proposals[winningProposal()].name;
    }
    
    // Дополнительные функции чтения
    
    /**
     * @dev Получить количество предложений
     * @return Количество предложений в бюллетене
     */
    function getProposalCount() public view returns (uint) {
        return proposals.length;
    }
    
    /**
     * @dev Получить информацию о предложении по индексу
     * @param index Индекс предложения
     * @return name Название предложения
     * @return voteCount Количество голосов за предложение
     */
    function getProposal(uint index) public view returns (bytes32 name, uint voteCount) {
        require(index < proposals.length, "Invalid proposal index");
        Proposal storage proposal = proposals[index];
        return (proposal.name, proposal.voteCount);
    }
    
    /**
     * @dev Получить информацию о голосующем
     * @param voter Адрес голосующего
     * @return weight Вес голоса
     * @return voted Проголосовал ли
     * @return delegate Адрес делегата
     * @return voteIndex Индекс выбранного предложения
     */
    function getVoterInfo(address voter) public view returns (uint weight, bool voted, address delegate, uint voteIndex) {
        Voter storage v = voters[voter];
        return (v.weight, v.voted, v.delegate, v.vote);
    }
    
    /**
     * @dev Получить общее количество голосов
     * @return Общее количество отданных голосов
     */
    function getTotalVotes() public view returns (uint) {
        uint total = 0;
        for (uint i = 0; i < proposals.length; i++) {
            total += proposals[i].voteCount;
        }
        return total;
    }
    
    // Дополнительные функции записи
    
    /**
     * @dev Сбросить голосование (только для председателя)
     * @notice Опасно! Удаляет все голоса
     */
    function resetVoting() public onlyChairperson {
        for (uint i = 0; i < proposals.length; i++) {
            proposals[i].voteCount = 0;
        }
        
        // Не сбрасываем права голоса, только статус голосования
        // Это сложнее реализовать безопасно
    }
    
    /**
     * @dev Проголосовать с проверкой веса голоса
     * @param proposal index of proposal in the proposals array
     */
    function voteWithWeight(uint proposal) public hasRightToVote {
        Voter storage sender = voters[msg.sender];
        require(!sender.voted, "Already voted.");
        require(proposal < proposals.length, "Invalid proposal index");
        
        sender.voted = true;
        sender.vote = proposal;
        proposals[proposal].voteCount += sender.weight;
        
        emit VoteCast(msg.sender, proposal, sender.weight);
    }
}
