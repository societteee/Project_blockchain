"use client";

import { useState, useEffect } from "react";
import { usePublicClient, useAccount, useContractRead, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { hexToString } from "viem";
import { hardhat } from "viem/chains";
import { Address } from "~~/components/scaffold-eth";
import { useDeployedContractInfo } from "~~/hooks/scaffold-eth";

export default function VotingPage() {
  const { address: connectedAddress } = useAccount();
  const [proposalIndex, setProposalIndex] = useState(0);
  const [delegateAddress, setDelegateAddress] = useState("");
  const [voterAddress, setVoterAddress] = useState("");
  const [proposals, setProposals] = useState<any[]>([]);
  const [voteStarted, setVoteStarted] = useState(false);
  const [voteWithWeightStarted, setVoteWithWeightStarted] = useState(false);
  
  const { data: contractInfo } = useDeployedContractInfo({ contractName: "Ballot", chainId: hardhat.id });
  
  const publicClient = usePublicClient({ chainId: hardhat.id });

  // Чтение данных
  const contractEnabled = !!contractInfo?.address && !!contractInfo?.abi;

  const { data: chairperson } = useContractRead({
    address: contractInfo?.address,
    abi: contractInfo?.abi,
    functionName: "chairperson",
    chainId: hardhat.id,
    enabled: contractEnabled,
  });
  
  const { data: proposalCount } = useContractRead({
    address: contractInfo?.address,
    abi: contractInfo?.abi,
    functionName: "getProposalCount",
    chainId: hardhat.id,
    enabled: contractEnabled,
  });
  
  const { data: winningProposal } = useContractRead({
    address: contractInfo?.address,
    abi: contractInfo?.abi,
    functionName: "winningProposal",
    chainId: hardhat.id,
    enabled: contractEnabled,
  });
  
  const { data: winnerName } = useContractRead({
    address: contractInfo?.address,
    abi: contractInfo?.abi,
    functionName: "winnerName",
    chainId: hardhat.id,
    enabled: contractEnabled,
  });
  
  const { data: totalVotes } = useContractRead({
    address: contractInfo?.address,
    abi: contractInfo?.abi,
    functionName: "getTotalVotes",
    chainId: hardhat.id,
    enabled: contractEnabled,
  });
  
  // Получение информации о текущем пользователе
  const { data: voterInfo } = useContractRead({
    address: contractInfo?.address,
    abi: contractInfo?.abi,
    functionName: "getVoterInfo",
    args: [connectedAddress],
    chainId: hardhat.id,
    enabled: contractEnabled && !!connectedAddress,
    watch: true,
  });

  const voterWeight = Number(voterInfo?.[0] ?? 0);
  const hasVoted = Boolean(voterInfo?.[1]);
  const canVote = !!connectedAddress && voterWeight > 0 && !hasVoted;
  
  // Запись данных
  const {
    data: voteData,
    isLoading: isVotePending,
    isSuccess: isVoteSuccess,
    isError: isVoteError,
    error: voteError,
    writeContractAsync: writeVote,
  } = useWriteContract();

  const {
    data: delegateData,
    isLoading: isDelegatePending,
    isSuccess: isDelegateSuccess,
    isError: isDelegateError,
    error: delegateError,
    writeContractAsync: writeDelegate,
  } = useWriteContract();

  const {
    data: giveRightData,
    isLoading: isGiveRightPending,
    isSuccess: isGiveRightSuccess,
    isError: isGiveRightError,
    error: giveRightError,
    writeContractAsync: writeGiveRightToVote,
  } = useWriteContract();

  const {
    data: voteWithWeightData,
    isLoading: isVoteWithWeightPending,
    isSuccess: isVoteWithWeightSuccess,
    isError: isVoteWithWeightError,
    error: voteWithWeightError,
    writeContractAsync: writeVoteWithWeight,
  } = useWriteContract();
  
  // Ожидание транзакций
  const { isLoading: isVoteReceiptLoading, isSuccess: isVoteReceiptSuccess, isError: isVoteReceiptError } = useWaitForTransactionReceipt({
    hash: voteData,
  });
  
  const { isLoading: isDelegateReceiptLoading, isSuccess: isDelegateReceiptSuccess, isError: isDelegateReceiptError } = useWaitForTransactionReceipt({
    hash: delegateData,
  });
  
  const { isLoading: isGiveRightReceiptLoading, isSuccess: isGiveRightReceiptSuccess, isError: isGiveRightReceiptError } = useWaitForTransactionReceipt({
    hash: giveRightData,
  });
  
  const { isLoading: isVoteWithWeightReceiptLoading, isSuccess: isVoteWithWeightReceiptSuccess, isError: isVoteWithWeightReceiptError } = useWaitForTransactionReceipt({
    hash: voteWithWeightData,
  });

  const isVoting = isVoteReceiptLoading;
  const isDelegating = isDelegateReceiptLoading;
  const isGivingRight = isGiveRightReceiptLoading;
  const isVotingWithWeight = isVoteWithWeightReceiptLoading;

  useEffect(() => {
    const fetchProposals = async () => {
      if (!proposalCount || !contractInfo?.address) return;
      
      try {
        const newProposals: Array<{ index: number; name: string; voteCount: number }> = [];

        for (let i = 0; i < Number(proposalCount); i++) {
          const proposal = await publicClient.readContract({
            address: contractInfo.address,
            abi: contractInfo.abi,
            functionName: "getProposal",
            args: [i],
          });

          newProposals.push({
            index: i,
            name: hexToString(proposal[0] as `0x${string}`, { size: 32 }),
            voteCount: Number(proposal[1]),
          });
        }

        setProposals(newProposals);
      } catch (error) {
        console.error("Failed to fetch proposals", error);
        setProposals([]);
      }
    };
    
    fetchProposals();
  }, [proposalCount, contractInfo, publicClient]);
  
  const handleVote = async () => {
    if (writeVote && contractInfo?.address && contractInfo?.abi) {
      setVoteStarted(true);
      await writeVote({
        address: contractInfo.address,
        abi: contractInfo.abi,
        functionName: "vote",
        args: [proposalIndex],
        chainId: hardhat.id,
      });
    }
  };
  
  const handleDelegate = async () => {
    if (writeDelegate && delegateAddress && contractInfo?.address && contractInfo?.abi) {
      await writeDelegate({
        address: contractInfo.address,
        abi: contractInfo.abi,
        functionName: "delegate",
        args: [delegateAddress],
        chainId: hardhat.id,
      });
    }
  };
  
  const handleGiveRightToVote = async () => {
    if (writeGiveRightToVote && voterAddress && contractInfo?.address && contractInfo?.abi) {
      await writeGiveRightToVote({
        address: contractInfo.address,
        abi: contractInfo.abi,
        functionName: "giveRightToVote",
        args: [voterAddress],
        chainId: hardhat.id,
      });
    }
  };
  
  const handleVoteWithWeight = async () => {
    if (writeVoteWithWeight && contractInfo?.address && contractInfo?.abi) {
      setVoteWithWeightStarted(true);
      await writeVoteWithWeight({
        address: contractInfo.address,
        abi: contractInfo.abi,
        functionName: "voteWithWeight",
        args: [proposalIndex],
        chainId: hardhat.id,
      });
    }
  };
  
  return (
    <div className="flex items-center flex-col grow pt-10">
      <div className="px-5 w-full max-w-4xl">
        <h1 className="text-center mb-8">
          <span className="block text-4xl font-bold">Система голосования</span>
          <span className="block text-xl mt-2">Децентрализованное голосование на блокчейне</span>
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Левая колонка: Информация и чтение данных */}
          <div className="space-y-6">
            <div className="card bg-base-100 shadow-xl p-6">
              <h2 className="text-2xl font-bold mb-4">Информация о системе</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-semibold">Председатель:</span>
                  <Address address={chairperson as string} />
                </div>
                
                <div className="flex justify-between">
                  <span className="font-semibold">Всего предложений:</span>
                  <span>{proposalCount?.toString() || "0"}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="font-semibold">Всего голосов:</span>
                  <span>{totalVotes?.toString() || "0"}</span>
                </div>
                
                {winningProposal !== undefined && (
                  <div className="flex justify-between">
                    <span className="font-semibold">Лидирующее предложение:</span>
                    <span>#{winningProposal?.toString()}</span>
                  </div>
                )}
                
                {winnerName && (
                  <div className="flex justify-between">
                    <span className="font-semibold">Победитель:</span>
                    <span>{hexToString(winnerName as `0x${string}`, { size: 32 })}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="card bg-base-100 shadow-xl p-6">
              <h2 className="text-2xl font-bold mb-4">Ваша информация</h2>
              
              {connectedAddress ? (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-semibold">Ваш адрес:</span>
                    <Address address={connectedAddress} />
                  </div>
                  
                  {voterInfo && (
                    <>
                      <div className="flex justify-between">
                        <span className="font-semibold">Вес голоса:</span>
                        <span>{voterInfo[0]?.toString()}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="font-semibold">Проголосовал:</span>
                        <span>{voterInfo[1] ? "Да" : "Нет"}</span>
                      </div>
                      
                      {voterInfo[2] !== "0x0000000000000000000000000000000000000000" && (
                        <div className="flex justify-between">
                          <span className="font-semibold">Делегат:</span>
                          <Address address={voterInfo[2]} />
                        </div>
                      )}
                      
                      {voterInfo[1] && (
                        <div className="flex justify-between">
                          <span className="font-semibold">Выбранное предложение:</span>
                          <span>#{voterInfo[3]?.toString()}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <p className="text-center text-warning">Подключите кошелек для просмотра информации</p>
              )}
              {connectedAddress && voterWeight === 0 && (
                <div className="alert alert-warning mt-4">
                  <span>
                    У вас нет права голоса на этом контракте. Подключите один из Hardhat аккаунтов или попросите
                    председателя предоставить право голоса.
                  </span>
                </div>
              )}
            </div>
            
            <div className="card bg-base-100 shadow-xl p-6">
              <h2 className="text-2xl font-bold mb-4">Предложения</h2>
              
              <div className="space-y-3">
                {proposals.map((proposal) => (
                  <div key={proposal.index} className="flex justify-between items-center p-3 bg-base-200 rounded-lg">
                    <div>
                      <span className="font-semibold">#{proposal.index}: {proposal.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{proposal.voteCount} голосов</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Правая колонка: Взаимодействие */}
          <div className="space-y-6">
            <div className="card bg-base-100 shadow-xl p-6">
              <h2 className="text-2xl font-bold mb-4">Голосование</h2>
              
              <div className="form-control w-full mb-4">
                <label className="label">
                  <span className="label-text">Выберите предложение</span>
                </label>
                <select 
                  className="select select-bordered w-full"
                  value={proposalIndex}
                  onChange={(e) => setProposalIndex(Number(e.target.value))}
                >
                  {proposals.map((proposal) => (
                    <option key={proposal.index} value={proposal.index}>
                      #{proposal.index}: {proposal.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex flex-col space-y-3">
                <button
                  className="btn btn-primary w-full"
                  onClick={handleVote}
                  disabled={!writeVote || isVoting || !canVote}
                >
                  {isVoting ? "Голосование..." : "Проголосовать"}
                </button>
                
                <button
                  className="btn btn-secondary w-full"
                  onClick={handleVoteWithWeight}
                  disabled={!writeVoteWithWeight || isVotingWithWeight || !canVote}
                >
                  {isVotingWithWeight ? "Голосование..." : "Проголосовать (с весом)"}
                </button>
              </div>

              {hasVoted && (
                <div className="alert alert-info mt-4">
                  <span>Вы уже проголосовали. Кнопки голосования отключены до смены аккаунта или новой сессии.</span>
                </div>
              )}
              
              {(isVoteReceiptSuccess || isVoteWithWeightReceiptSuccess) && (
                <div className="alert alert-success mt-4">
                  <span>Голос успешно зарегистрирован!</span>
                </div>
              )}
            </div>
            
            <div className="card bg-base-100 shadow-xl p-6">
              <h2 className="text-2xl font-bold mb-4">Делегирование голоса</h2>
              
              <div className="form-control w-full mb-4">
                <label className="label">
                  <span className="label-text">Адрес делегата</span>
                </label>
                <input
                  type="text"
                  placeholder="0x..."
                  className="input input-bordered w-full"
                  value={delegateAddress}
                  onChange={(e) => setDelegateAddress(e.target.value)}
                />
              </div>
              
              <button
                className="btn btn-accent w-full"
                onClick={handleDelegate}
                disabled={!writeDelegate || isDelegating || !connectedAddress || !delegateAddress}
              >
                {isDelegating ? "Делегирование..." : "Делегировать голос"}
              </button>
              
              {isDelegateSuccess && (
                <div className="alert alert-success mt-4">
                  <span>Голос успешно делегирован!</span>
                </div>
              )}
            </div>
            
            {connectedAddress === chairperson && (
              <div className="card bg-base-100 shadow-xl p-6">
                <h2 className="text-2xl font-bold mb-4">Предоставление права голоса (только председатель)</h2>
                
                <div className="form-control w-full mb-4">
                  <label className="label">
                    <span className="label-text">Адрес голосующего</span>
                  </label>
                  <input
                    type="text"
                    placeholder="0x..."
                    className="input input-bordered w-full"
                    value={voterAddress}
                    onChange={(e) => setVoterAddress(e.target.value)}
                  />
                </div>
                
                <button
                  className="btn btn-warning w-full"
                  onClick={handleGiveRightToVote}
                  disabled={!writeGiveRightToVote || isGivingRight || !voterAddress}
                >
                  {isGivingRight ? "Предоставление права..." : "Предоставить право голоса"}
                </button>
                
                {isGiveRightSuccess && (
                  <div className="alert alert-success mt-4">
                    <span>Право голоса успешно предоставлено!</span>
                  </div>
                )}
              </div>
            )}
            
            <div className="card bg-base-100 shadow-xl p-6">
              <h2 className="text-2xl font-bold mb-4">Статус транзакций</h2>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Голосование:</span>
                  <span className={isVoting ? "text-warning" : isVoteReceiptSuccess ? "text-success" : isVoteReceiptError ? "text-error" : hasVoted ? "text-info" : "text-base-content"}>
                    {isVoting
                      ? "В процессе..."
                      : isVoteReceiptSuccess
                      ? "Успешно"
                      : isVoteReceiptError
                      ? "Ошибка"
                      : hasVoted
                      ? "Уже проголосовано"
                      : "Не начато"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Делегирование:</span>
                  <span className={isDelegating ? "text-warning" : isDelegateSuccess ? "text-success" : isDelegateError ? "text-error" : "text-base-content"}>
                    {isDelegating ? "В процессе..." : isDelegateSuccess ? "Успешно" : isDelegateError ? "Ошибка" : "Не начато"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Предоставление права:</span>
                  <span className={isGivingRight ? "text-warning" : isGiveRightSuccess ? "text-success" : isGiveRightError ? "text-error" : "text-base-content"}>
                    {isGivingRight ? "В процессе..." : isGiveRightSuccess ? "Успешно" : isGiveRightError ? "Ошибка" : "Не начато"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Голосование с весом:</span>
                  <span className={isVotingWithWeight ? "text-warning" : isVoteWithWeightSuccess ? "text-success" : isVoteWithWeightError ? "text-error" : hasVoted ? "text-info" : "text-base-content"}>
                    {isVotingWithWeight
                      ? "В процессе..."
                      : isVoteWithWeightSuccess
                      ? "Успешно"
                      : isVoteWithWeightError
                      ? "Ошибка"
                      : hasVoted
                      ? "Уже проголосовано"
                      : "Не начато"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-sm text-base-content/70">
            Система голосования обеспечивает прозрачное и безопасное голосование с возможностью делегирования голосов.
            Каждый адрес может проголосовать только один раз.
          </p>
        </div>
      </div>
    </div>
  );
}