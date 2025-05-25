// === FRONTEND (React Component: App.js) with fixed layPhase and tighter card spacing ===
import React, { useEffect, useState } from 'react';
import socketClient from 'socket.io-client';
import './App.css';

const socket = socketClient('https://phase10-backend-6lds.onrender.com');

function App() {
  const [name, setName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [game, setGame] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [chatLog, setChatLog] = useState([]);
  const [selected, setSelected] = useState([]);
  const [cardToDiscard, setCardToDiscard] = useState(null);
  const [showSkipModal, setShowSkipModal] = useState(false);

  useEffect(() => {
    socket.on('roomUpdate', setGame);
    socket.on('gameStarted', setGame);
    socket.on('gameStateUpdate', setGame);
    socket.on('chatMessage', data =>
      setChatLog(log => [...log, `${data.playerName || 'Player'}: ${data.message}`])
    );
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
      default: return '#222';
    }
  };

  const createRoom = () => {
    socket.emit('createRoom', { playerName: name });
  };

  const joinRoom = () => {
    socket.emit('joinRoom', { roomId, playerName: name });
  };

  const startGame = () => {
    socket.emit('startGame', { roomId: game.roomId });
  };

  const draw = (from) => {
    socket.emit('drawCard', { roomId: game.roomId, from });
  };

  const toggleSelect = (card) => {
    if (selected.includes(card)) {
      setSelected(selected.filter(c => c !== card));
    } else {
      setSelected([...selected, card]);
    }
  };

  const discard = () => {
    if (selected.length === 1 && selected[0].value !== 'Skip') {
      socket.emit('discardCard', { roomId: game.roomId, card: selected[0] });
      setSelected([]);
    } else if (selected.length === 1 && selected[0].value === 'Skip') {
      setCardToDiscard(selected[0]);
      setShowSkipModal(true);
    }
  };

  const layPhase = () => {
    if (selected.length > 0) {
      socket.emit('layPhase', { roomId: game.roomId, cards: selected });
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

  const me = game?.players.find(p => p.name === name);
  const isMyTurn = game?.players[game.currentTurn]?.name === name;
  const topDiscard = game?.discardPile?.[game.discardPile.length - 1];
  const isMobile = window.innerWidth < 768;

  const sortedHand = me?.hand?.slice().sort((a, b) => {
    const getVal = v => isNaN(v) ? 100 : Number(v);
    return getVal(a.value) - getVal(b.value);
  });

  return (
    <div className="app-container grid-pattern">
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
          {isMobile && <button className="neon-button" onClick={shareGame}>📲 Invite</button>}

          <div className="players-list">
            {game.players.map((p, idx) => (
              <div key={p.id} className="player-name">
                {p.name} ({p.hand.length} cards){p.phaseComplete ? ' ✅' : ''}
              </div>
            ))}
          </div>

          {!game.started && <button onClick={startGame} className="neon-button">Start Game</button>}

          {game.started && (
            <>
              <div className="pile-display">
                <div
                  className="cyberpunk-card font-orbitron"
                  onClick={() => draw('deck')}
                  style={{ opacity: 1, cursor: 'pointer', fontSize: '1rem' }}
                >
                  DRAW
                </div>
                <div
                  className="cyberpunk-card"
                  onClick={discard}
                  style={{
                    backgroundColor: getCardColor(topDiscard?.color),
                    cursor: selected.length === 1 ? 'pointer' : 'default',
                    opacity: selected.length === 1 ? 1 : 0.6
                  }}
                >
                  {topDiscard ? topDiscard.value : '⬛'}
                </div>
              </div>

              {isMyTurn && (
                <div className="card-play-area" style={{ overflowX: 'hidden' }}>
                  <div
                    className="card-row-horizontal"
                    style={{ justifyContent: 'center', flexWrap: 'wrap' }}
                  >
                    {sortedHand.map((card, i) => (
                      <div
                        key={i}
                        onClick={() => toggleSelect(card)}
                        className={`cyberpunk-card ${selected.includes(card) ? 'selected-card' : ''}`}
                        style={{
                          backgroundColor: getCardColor(card.color),
                          width: '48px',
                          height: '68px',
                          fontSize: '1rem',
                          margin: '2px'
                        }}
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
            </>
          )}

          <div className="chat-section">
            <h3 className="section-title">Chat</h3>
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
              {game.players.filter(p => p.name !== name).map((p, i) => (
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
