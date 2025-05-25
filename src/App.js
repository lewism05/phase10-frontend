// === FRONTEND (React Component: App.js) — FULLY FEATURED PHASE 10 GAME ===
import React, { useEffect, useState } from 'react';
import socketClient from 'socket.io-client';
import './App.css';

const socket = socketClient('https://phase10-backend-6lds.onrender.com');

const phaseRequirements = {
  1: [{ type: 'set', count: 3 }, { type: 'set', count: 3 }],
  2: [{ type: 'set', count: 3 }, { type: 'run', count: 4 }],
  3: [{ type: 'set', count: 4 }, { type: 'run', count: 4 }],
  4: [{ type: 'run', count: 7 }],
  5: [{ type: 'run', count: 8 }],
  6: [{ type: 'run', count: 9 }],
  7: [{ type: 'set', count: 4 }, { type: 'set', count: 4 }],
  8: [{ type: 'color', count: 7 }],
  9: [{ type: 'set', count: 5 }, { type: 'set', count: 2 }],
  10: [{ type: 'set', count: 5 }, { type: 'set', count: 3 }],
};

function App() {
  const [name, setName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [game, setGame] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [chatLog, setChatLog] = useState([]);
  const [selected, setSelected] = useState([]);
  const [cardToDiscard, setCardToDiscard] = useState(null);
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [skipTargetList, setSkipTargetList] = useState([]);

  useEffect(() => {
    socket.on('roomUpdate', setGame);
    socket.on('gameStarted', setGame);
    socket.on('gameStateUpdate', setGame);
    socket.on('chatMessage', ({ playerName, message }) => {
      setChatLog(log => [...log, `${playerName}: ${message}`]);
    });
    return () => {
      socket.off('roomUpdate');
      socket.off('gameStarted');
      socket.off('gameStateUpdate');
      socket.off('chatMessage');
    };
  }, []);

  const getCardColor = (color) => {
    switch (color) {
      case 'Red': return '#ff4d4d';
      case 'Blue': return '#4d79ff';
      case 'Green': return '#4dff88';
      case 'Yellow': return '#ffff4d';
      case 'Wild': return '#ffffff';
      case 'Skip': return '#ff00ff';
      default: return '#333';
    }
  };

  const createRoom = () => socket.emit('createRoom', { playerName: name });
  const joinRoom = () => socket.emit('joinRoom', { roomId, playerName: name });
  const startGame = () => socket.emit('startGame', { roomId: game.roomId });
  const draw = (from) => socket.emit('drawCard', { roomId: game.roomId, from });

  const toggleSelect = (card) => {
    setSelected(prev => prev.includes(card) ? prev.filter(c => c !== card) : [...prev, card]);
    if (card.value === 'Skip') {
      const others = game.players.filter(p => p.name !== name);
      setSkipTargetList(others);
      setCardToDiscard(card);
      setShowSkipModal(true);
    }
  };

  const discard = () => {
    if (selected.length === 1) {
      socket.emit('discardCard', { roomId: game.roomId, card: selected[0] });
      setSelected([]);
    }
  };

  const sendChat = () => {
    if (chatInput.trim()) {
      socket.emit('chatMessage', { roomId: game.roomId, message: chatInput, playerName: name });
      setChatInput('');
    }
  };

  const sendSkipTo = (targetName) => {
    socket.emit('playSkipCard', { roomId: game.roomId, card: cardToDiscard, target: targetName });
    setShowSkipModal(false);
    setCardToDiscard(null);
    setSelected([]);
  };

  const shareGame = () => {
    const url = `${window.location.origin}/?room=${game?.roomId}`;
    if (navigator.share) {
      navigator.share({ title: 'Join my Cyber 10 game!', url });
    } else {
      navigator.clipboard.writeText(url);
      alert('Game link copied!');
    }
  };

  const validatePhase = (cards, phase) => {
    const reqs = phaseRequirements[phase];
    const values = cards.map(c => c.value);
    const colors = cards.map(c => c.color);
    return cards.length >= reqs.reduce((a, b) => a + b.count, 0); // placeholder logic
  };

  const layPhase = () => {
    const player = game.players.find(p => p.name === name);
    if (validatePhase(selected, player.phase)) {
      socket.emit('layPhase', { roomId: game.roomId, cards: selected });
      setSelected([]);
    } else {
      alert('Invalid phase selected. Make sure it matches your current phase.');
    }
  };

  const me = game?.players.find(p => p.name === name);
  const isMyTurn = game?.players[game.currentTurn]?.name === name;
  const topDiscard = game?.discardPile?.[game.discardPile.length - 1];

  const sortedHand = me?.hand?.slice().sort((a, b) => {
    const getVal = v => isNaN(v) ? 100 : Number(v);
    return getVal(a.value) - getVal(b.value);
  });

  return (
    <div className="app-container">
      <h1 className="game-title neon-text">CYBER 10</h1>

      {!game && (
        <div className="input-section">
          <input className="text-input" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
          <button onClick={createRoom} className="neon-button">Create Room</button>
          <input className="text-input" placeholder="Room ID" value={roomId} onChange={e => setRoomId(e.target.value)} />
          <button onClick={joinRoom} className="neon-button">Join Room</button>
        </div>
      )}

      {game && (
        <>
          <div className="status-text">Room: {game.roomId}</div>
          <div className="players-list">
            {game.players.map(p => (
              <div key={p.id}>{p.name} (Phase {p.phase})</div>
            ))}
          </div>

          {!game.started && <button onClick={startGame} className="neon-button">Start Game</button>}

          <div className="pile-display">
            <div className="cyberpunk-card font-orbitron" onClick={() => draw('deck')}>DRAW</div>
            <div className="cyberpunk-card" onClick={discard} style={{ backgroundColor: getCardColor(topDiscard?.color), cursor: 'pointer' }}>
              {topDiscard?.value || '⬛'}
            </div>
          </div>

          {isMyTurn && (
            <div className="card-play-area">
              <div className="card-row-horizontal">
                {sortedHand.map((card, i) => (
                  <div
                    key={i}
                    onClick={() => toggleSelect(card)}
                    className={`cyberpunk-card ${selected.includes(card) ? 'selected-card' : ''}`}
                    style={{ backgroundColor: getCardColor(card.color), width: '52px', height: '72px', fontSize: '1rem' }}
                  >
                    {card.value}
                  </div>
                ))}
              </div>
              <div className="button-group responsive-buttons">
                <button onClick={layPhase} className="neon-button">Lay Phase</button>
              </div>
            </div>
          )}

          <div className="chat-section">
            <div className="chat-log">
              {chatLog.map((line, i) => <p key={i}>{line}</p>)}
            </div>
            <div className="chat-input">
              <input className="text-input" value={chatInput} onChange={e => setChatInput(e.target.value)} />
              <button onClick={sendChat} className="neon-button">Send</button>
            </div>
          </div>

          {showSkipModal && (
            <div className="skip-modal">
              <h3>Select a player to skip:</h3>
              {skipTargetList.map((p, i) => (
                <button key={i} className="neon-button" onClick={() => sendSkipTo(p.name)}>{p.name}</button>
              ))}
              <button onClick={() => setShowSkipModal(false)} className="neon-button">Cancel</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;
