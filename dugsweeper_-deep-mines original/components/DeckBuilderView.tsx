
import React, { useState, useMemo } from 'react';
import { Inventory, CardInstance, CardType } from '../types';
import Card from './Card';

interface DeckBuilderViewProps {
  inventory: Inventory;
  onSave: (newDeck: CardInstance[], newCollection: CardInstance[]) => void;
  onBack: () => void;
}

const DeckBuilderView: React.FC<DeckBuilderViewProps> = ({ inventory, onSave, onBack }) => {
  const [currentDeck, setCurrentDeck] = useState<CardInstance[]>([...inventory.deck]);
  const [currentCollection, setCurrentCollection] = useState<CardInstance[]>([...inventory.collection]);

  const DECK_SIZE_LIMIT = 20;

  // Group collection by CardType for easier viewing
  const groupedCollection = useMemo(() => {
    const groups: Record<string, CardInstance[]> = {};
    currentCollection.forEach(card => {
      const type = card.def.type;
      if (!groups[type]) groups[type] = [];
      groups[type].push(card);
    });
    return groups;
  }, [currentCollection]);

  const addToDeck = (type: CardType) => {
    if (currentDeck.length >= DECK_SIZE_LIMIT) return;
    
    const index = currentCollection.findIndex(c => c.def.type === type);
    if (index !== -1) {
      const card = currentCollection[index];
      const newCollection = [...currentCollection];
      newCollection.splice(index, 1);
      
      setCurrentCollection(newCollection);
      setCurrentDeck([...currentDeck, card]);
    }
  };

  const removeFromDeck = (id: string) => {
    const index = currentDeck.findIndex(c => c.id === id);
    if (index !== -1) {
      const card = currentDeck[index];
      const newDeck = [...currentDeck];
      newDeck.splice(index, 1);
      
      setCurrentDeck(newDeck);
      setCurrentCollection([...currentCollection, card]);
    }
  };

  const isValid = currentDeck.length === DECK_SIZE_LIMIT;

  return (
    <div className="fixed inset-0 z-[250] bg-[#050505] flex flex-col font-mono text-white p-4">
      <div className="max-w-6xl w-full mx-auto flex flex-col h-full bg-slate-900 border-4 border-slate-700 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
          <div>
            <h2 className="text-2xl font-black text-cyan-400 uppercase tracking-tighter">Deck Logistics</h2>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">Active Deck must contain exactly {DECK_SIZE_LIMIT} units</p>
          </div>
          <div className="flex gap-4 items-center">
            <div className={`px-4 py-2 border-2 font-black ${isValid ? 'border-green-500 text-green-500' : 'border-red-500 text-red-500 animate-pulse'}`}>
              DECK: {currentDeck.length} / {DECK_SIZE_LIMIT}
            </div>
            <button 
              onClick={() => onSave(currentDeck, currentCollection)}
              disabled={!isValid}
              className={`px-8 py-2 font-black uppercase transition-all ${isValid ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
            >
              Confirm Loadout
            </button>
            <button onClick={onBack} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-black uppercase">Cancel</button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Collection Side */}
          <div className="w-2/3 p-6 border-r border-slate-700 overflow-y-auto custom-scrollbar">
            <h3 className="text-sm font-bold text-slate-400 uppercase mb-6 tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 bg-cyan-500 rounded-full"></span>
              Available Collection
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {/* Added explicit type casting to the entries to resolve 'unknown' type inference on cards.length */}
              {(Object.entries(groupedCollection) as [string, CardInstance[]][]).map(([type, cards]) => (
                <div key={type} className="relative group">
                  <div className="relative">
                    <Card card={cards[0]} onClick={() => addToDeck(type as CardType)} />
                    <div className="absolute -top-2 -right-2 bg-cyan-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-white shadow-lg">
                      x{cards.length}
                    </div>
                  </div>
                  <div className="mt-2 text-center text-[10px] font-bold text-slate-500 uppercase group-hover:text-cyan-400 transition-colors">
                    Click to Add
                  </div>
                </div>
              ))}
              {currentCollection.length === 0 && (
                <div className="col-span-full py-20 text-center text-slate-600 italic">
                  Collection exhausted. Mine deeper to find more units.
                </div>
              )}
            </div>
          </div>

          {/* Active Deck Side */}
          <div className="w-1/3 p-6 bg-black/30 overflow-y-auto custom-scrollbar">
            <h3 className="text-sm font-bold text-slate-400 uppercase mb-6 tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Active Loadout
            </h3>
            
            <div className="flex flex-wrap gap-4 justify-center">
              {currentDeck.map((card, idx) => (
                <div key={card.id} className="relative group">
                  <Card card={card} small onClick={() => removeFromDeck(card.id)} />
                  <div className="absolute inset-0 bg-red-500/0 group-hover:bg-red-500/20 transition-colors pointer-events-none rounded-lg flex items-center justify-center">
                    <span className="text-[10px] font-black text-white opacity-0 group-hover:opacity-100 uppercase tracking-tighter">Remove</span>
                  </div>
                </div>
              ))}
              {Array.from({ length: Math.max(0, DECK_SIZE_LIMIT - currentDeck.length) }).map((_, i) => (
                <div key={i} className="w-16 h-20 border-2 border-dashed border-slate-800 rounded-lg flex items-center justify-center">
                   <span className="text-slate-800 text-[10px] font-bold">EMPTY</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeckBuilderView;
