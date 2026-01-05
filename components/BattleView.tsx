
import React, { useState, useEffect } from 'react';
import { BattleState, CardInstance, CardType, PlayerSide, Inventory } from '../types';
import { CARD_DEFINITIONS } from '../constants';
import Card from './Card';

interface BattleViewProps {
  playerInventory: Inventory;
  onWin: (reward: any) => void;
  onLose: () => void;
}

const BattleView: React.FC<BattleViewProps> = ({ playerInventory, onWin, onLose }) => {
  const [battle, setBattle] = useState<BattleState | null>(null);
  const [selectedHandIdx, setSelectedHandIdx] = useState<number | null>(null);

  const shuffle = <T,>(array: T[]): T[] => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const initBattle = () => {
    const generateEnemyDeck = () => {
      const types = Object.values(CardType).filter(t => t !== CardType.RUBBLE && t !== CardType.VETERAN);
      return Array.from({ length: 20 }, (_, i) => ({
        id: `enemy-${Date.now()}-${i}`,
        def: CARD_DEFINITIONS[types[Math.floor(Math.random() * types.length)]],
        owner: 'ENEMY' as PlayerSide,
        currentValue: 3,
      }) as CardInstance);
    };

    const playerDeck = shuffle([...playerInventory.deck]);
    const enemyDeck = shuffle(generateEnemyDeck());

    setBattle({
      grid: Array(16).fill(null),
      playerHand: playerDeck.splice(0, 6),
      playerDeck: playerDeck,
      enemyHand: enemyDeck.splice(0, 6),
      enemyDeck: enemyDeck,
      turn: 'PLAYER',
      turnCount: 0,
      gameLog: ['Battle Engaged. Deploying units to forward positions.'],
      gameOver: false,
      winner: null
    });
  };

  useEffect(() => {
    initBattle();
  }, []);

  const getNeighbors = (index: number) => {
    const neighbors = [];
    const row = Math.floor(index / 4);
    const col = index % 4;
    if (row > 0) neighbors.push(index - 4);
    if (row < 3) neighbors.push(index + 4);
    if (col > 0) neighbors.push(index - 1);
    if (col < 3) neighbors.push(index + 1);
    return neighbors;
  };

  const drawCard = (state: BattleState, side: PlayerSide) => {
    if (side === 'PLAYER') {
      if (state.playerDeck.length > 0 && state.playerHand.length < 6) {
        state.playerHand.push(state.playerDeck.shift()!);
      }
    } else {
      if (state.enemyDeck.length > 0 && state.enemyHand.length < 6) {
        state.enemyHand.push(state.enemyDeck.shift()!);
      }
    }
  };

  const handleCellClick = (idx: number) => {
    if (!battle || battle.gameOver || battle.turn !== 'PLAYER' || selectedHandIdx === null) return;
    if (battle.grid[idx]) return;

    const newBattle = { ...battle };
    const card = newBattle.playerHand[selectedHandIdx];
    
    newBattle.grid[idx] = card;
    newBattle.playerHand.splice(selectedHandIdx, 1);
    newBattle.gameLog.unshift(`Player deployed ${card.def.name}`);

    // Resolve neighbor effects (simplified)
    const neighbors = getNeighbors(idx);
    neighbors.forEach(n => {
      const neighbor = newBattle.grid[n];
      if (neighbor && neighbor.owner !== card.owner) {
        if (card.def.type === CardType.PICKAXE) {
          neighbor.currentValue = Math.max(0, neighbor.currentValue - 1);
          newBattle.gameLog.unshift(`${card.def.name} chipped away at ${neighbor.def.name}`);
        }
      }
    });

    drawCard(newBattle, 'PLAYER');
    checkGameOver(newBattle);
    newBattle.turn = 'ENEMY';
    setBattle(newBattle);
    setSelectedHandIdx(null);

    setTimeout(() => runAI(newBattle), 800);
  };

  const runAI = (currentBattle: BattleState) => {
    if (currentBattle.gameOver) return;
    const nextBattle = { ...currentBattle };
    const emptySlots = nextBattle.grid.map((v, i) => v === null ? i : -1).filter(i => i !== -1);
    
    if (emptySlots.length === 0 || (nextBattle.enemyHand.length === 0 && nextBattle.enemyDeck.length === 0)) {
      nextBattle.gameOver = true;
      checkGameOver(nextBattle);
      setBattle(nextBattle);
      return;
    }

    const slot = emptySlots[Math.floor(Math.random() * emptySlots.length)];
    const cardIdx = Math.floor(Math.random() * nextBattle.enemyHand.length);
    const card = nextBattle.enemyHand[cardIdx];

    nextBattle.grid[slot] = card;
    nextBattle.enemyHand.splice(cardIdx, 1);
    nextBattle.gameLog.unshift(`Enemy deployed ${card.def.name}`);
    
    drawCard(nextBattle, 'ENEMY');
    nextBattle.turn = 'PLAYER';

    checkGameOver(nextBattle);
    setBattle(nextBattle);
  };

  const checkGameOver = (state: BattleState) => {
    const gridFull = state.grid.every(c => c !== null);
    const noMovesLeft = (state.playerHand.length === 0 && state.playerDeck.length === 0) &&
                        (state.enemyHand.length === 0 && state.enemyDeck.length === 0);

    if (gridFull || noMovesLeft) {
      state.gameOver = true;
      let pScore = 0; let eScore = 0;
      state.grid.forEach(c => {
        if (c?.owner === 'PLAYER') pScore += c.currentValue;
        if (c?.owner === 'ENEMY') eScore += c.currentValue;
      });
      state.winner = pScore > eScore ? 'PLAYER' : eScore > pScore ? 'ENEMY' : 'DRAW';
    }
  };

  if (!battle) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950 flex flex-col items-center justify-center p-4 font-mono">
      <div className="w-full max-w-5xl bg-slate-900 border-4 border-slate-700 shadow-2xl p-6 rounded-sm flex flex-col gap-6">
        
        <div className="flex justify-between items-center border-b border-slate-700 pb-2">
            <div>
              <h2 className="text-cyan-400 font-black uppercase tracking-widest text-xl">Operation Surface</h2>
              <div className="text-[9px] text-slate-500 uppercase font-bold">Grid Combat Protocol v2.4</div>
            </div>
            <div className="flex items-center gap-6">
               <div className="flex flex-col items-end">
                 <div className="text-[10px] text-red-500 font-bold uppercase">Enemy Reserves</div>
                 <div className="text-lg font-black text-red-400">{battle.enemyDeck.length}</div>
               </div>
               <div className="w-px h-8 bg-slate-700"></div>
               <div className="flex flex-col items-start">
                 <div className="text-[10px] text-blue-500 font-bold uppercase">Player Reserves</div>
                 <div className="text-lg font-black text-blue-400">{battle.playerDeck.length}</div>
               </div>
            </div>
        </div>

        <div className="flex gap-8 justify-center">
            {/* Grid */}
            <div className="grid grid-cols-4 gap-2 bg-slate-800 p-2 border border-slate-600 rounded-sm">
              {battle.grid.map((cell, i) => (
                <div 
                  key={i} 
                  onClick={() => handleCellClick(i)}
                  className={`w-20 h-28 border-2 border-dashed border-slate-700 rounded-md flex items-center justify-center transition-all ${!cell && battle.turn === 'PLAYER' && selectedHandIdx !== null ? 'hover:bg-cyan-500/20 cursor-pointer border-cyan-500/50' : ''}`}
                >
                  {cell ? <Card card={cell} small /> : <span className="text-slate-700 text-[10px]">{i+1}</span>}
                </div>
              ))}
            </div>

            {/* Log */}
            <div className="flex-1 bg-black/50 p-4 border border-slate-700 rounded-sm overflow-y-auto h-[480px] flex flex-col-reverse gap-2">
               {battle.gameLog.map((log, i) => (
                 <div key={i} className={`text-[10px] border-l-2 pl-2 py-1 ${log.includes('Player') ? 'text-blue-400 border-blue-500' : 'text-red-400 border-red-500'}`}>
                   {log}
                 </div>
               ))}
            </div>
        </div>

        {/* Player Hand */}
        <div className="flex flex-col gap-2">
            <div className="flex justify-between items-end">
              <div className="text-[8px] text-slate-500 uppercase tracking-widest font-bold">Tactical Deployment Hand</div>
              <div className="text-[10px] text-slate-400 font-bold">TURN: {battle.turnCount}</div>
            </div>
            <div className="flex gap-4 justify-center bg-slate-800/50 p-4 rounded-sm border border-slate-700 h-40 items-center overflow-x-auto relative">
              {battle.playerHand.map((card, i) => (
                <Card 
                  key={card.id} 
                  card={card} 
                  isSelected={selectedHandIdx === i}
                  onClick={() => battle.turn === 'PLAYER' && setSelectedHandIdx(i)}
                />
              ))}
              {battle.playerHand.length === 0 && battle.playerDeck.length === 0 && <span className="text-slate-600 italic uppercase font-black">Out of Units</span>}
              
              {battle.turn === 'ENEMY' && (
                <div className="absolute inset-0 bg-red-950/20 backdrop-blur-[1px] flex items-center justify-center">
                   <span className="text-red-500 font-black uppercase tracking-[0.5em] animate-pulse">Enemy Tactical Phase</span>
                </div>
              )}
            </div>
        </div>

        {battle.gameOver && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-12 text-center animate-in fade-in zoom-in duration-300 z-[300]">
             <h3 className={`text-6xl font-black uppercase mb-4 tracking-tighter ${battle.winner === 'PLAYER' ? 'text-green-500' : 'text-red-500'}`}>
               {battle.winner === 'PLAYER' ? 'VICTORY SECURED' : battle.winner === 'ENEMY' ? 'RETREAT ORDERED' : 'STALEMATE'}
             </h3>
             <div className="bg-slate-800 p-8 border-2 border-slate-700 rounded-sm mb-8">
                <div className="flex gap-20 justify-center">
                   <div className="text-center">
                      <div className="text-[10px] text-slate-500 uppercase mb-2">Friendly Morale</div>
                      <div className="text-5xl font-black text-blue-500">{battle.grid.filter(c => c?.owner === 'PLAYER').reduce((acc, c) => acc + (c?.currentValue || 0), 0)}</div>
                   </div>
                   <div className="text-center">
                      <div className="text-[10px] text-slate-500 uppercase mb-2">Hostile Force</div>
                      <div className="text-5xl font-black text-red-500">{battle.grid.filter(c => c?.owner === 'ENEMY').reduce((acc, c) => acc + (c?.currentValue || 0), 0)}</div>
                   </div>
                </div>
             </div>
             <p className="text-slate-400 mb-8 max-w-sm font-mono text-sm uppercase">Sector control has been updated. Return for post-mission debriefing.</p>
             <button 
              onClick={() => battle.winner === 'PLAYER' ? onWin({}) : onLose()}
              className="bg-white text-black font-black px-16 py-5 hover:scale-105 active:scale-95 transition-all uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(255,255,255,0.3)]"
             >
               Finalize Deployment
             </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BattleView;
