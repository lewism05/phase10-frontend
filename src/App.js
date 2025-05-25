// === FRONTEND (React Component: App.js) with Pure CSS Cyberpunk Theme (cards aligned horizontally) ===
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

  useEffect(() => {
    socket.on('roomUpdate', setGame);
    socket.on('gameStarted', setGame);
    socket.on('gameStateUpdate', setGame);
    socket.on('chatMessage', data => setChatLog(log => [...log, `${data.player}: ${data.message}`]));
    return () => {
      socket.off('roomUpdate');
      socket.off('gameStarted');
      socket.off('gameStateUpdate');
      socket.off('chatMessage');
    };
  }, []);

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

  const discard = (card) => {
    socket.emit('discardCard', { roomId: game.roomId, card });
    setSelected([]);
  };

  const toggleSelect = (card) => {
    const key = card.color + '-' + card.value;
    const exists = selected.find(c => c.color + '-' + c.value === key);
    if (exists) {
      setSelected(selected.filter(c => c.color + '-' + c.value !== key));
    } else {
      setSelected([...selected, card]);
    }
  };

  const layPhase = () => {
    socket.emit('layPhase', { roomId: game.roomId, selected });
    setSelected([]);
  };

  const sendChat = () => {
    if (chatInput.trim()) {
      socket.emit('chatMessage', { roomId: game.roomId, message: chatInput });
      setChatInput('');
    }
  };

  const me = game?.players.find(p => p.name === name);
  const isMyTurn = game?.players[game.currentTurn]?.name === name;

  return (
    <div className="app-container grid-pattern">
      <h1 className="game-title neon-text">CYBERPUNK 10</h1>

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
            {game.players.map((p, idx) => (
              <div key={p.id} className="player-name">
                {p.name} ({p.hand.length} cards){p.phaseComplete ? ' ✅' : ''}
              </div>
            ))}
          </div>

          {!game.started && <button onClick={startGame} className="neon-button">Start Game</button>}

          {game.started && isMyTurn && (
            <div className="card-play-area">
              <h2 className="section-title">Your Hand</h2>
              <div className="card-row-horizontal">
                {me.hand.map((card, i) => (
                  <div
                    key={i}
                    onClick={() => toggleSelect(card)}
                    className={`cyberpunk-card ${selected.includes(card) ? 'selected-card' : ''}`}
                  >
                    {card.value}
                  </div>
                ))}
              </div>
              <div className="button-group">
                <button onClick={() => draw('deck')} className="neon-button">Draw Deck</button>
                <button onClick={() => draw('discard')} className="neon-button">Draw Discard</button>
                <button onClick={layPhase} className="neon-button">Lay Phase</button>
              </div>
            </div>
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
        </>
      )}
    </div>
  );
}

export default App;
