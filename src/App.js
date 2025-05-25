// === FRONTEND (React Component: App.js) ===
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
    playClick();
  };

  const joinRoom = () => {
    socket.emit('joinRoom', { roomId, playerName: name });
    playClick();
  };

  const startGame = () => {
    socket.emit('startGame', { roomId: game.roomId });
    playClick();
  };

  const draw = (from) => {
    socket.emit('drawCard', { roomId: game.roomId, from });
    playClick();
  };

  const discard = (card) => {
    socket.emit('discardCard', { roomId: game.roomId, card });
    setSelected([]);
    playClick();
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
    playClick();
  };

  const sendChat = () => {
    if (chatInput.trim()) {
      socket.emit('chatMessage', { roomId: game.roomId, message: chatInput });
      setChatInput('');
      playClick();
    }
  };

  const playClick = () => {
    const audio = new Audio('https://freesound.org/data/previews/256/256113_3263906-lq.mp3');
    audio.volume = 0.2;
    audio.play();
  };

  const me = game?.players.find(p => p.name === name);
  const isMyTurn = game?.players[game.currentTurn]?.name === name;

  return (
    <div style={{ padding: 20, fontFamily: 'Orbitron, sans-serif', color: '#00ffe7', backgroundColor: '#0e0e0e', minHeight: '100vh', backgroundImage: 'radial-gradient(circle at center, #1a1a1a, #0e0e0e)', backgroundRepeat: 'no-repeat' }}>
      <h1 style={{ textAlign: 'center', color: '#ff00c8', textShadow: '0 0 10px #ff00c8' }}>Cyberpunk 10</h1>

      {!game && (
        <div style={{ textAlign: 'center' }}>
          <input placeholder="Your name" value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
          <button onClick={createRoom} style={buttonStyle}>Create Room</button>
          <br /><br />
          <input placeholder="Room ID" value={roomId} onChange={e => setRoomId(e.target.value)} style={inputStyle} />
          <button onClick={joinRoom} style={buttonStyle}>Join Room</button>
        </div>
      )}

      {game && (
        <>
          <h2>Room: {game.roomId}</h2>
          <ul>
            {game.players.map((p, idx) => (
              <li key={p.id} style={{ fontWeight: game.currentTurn === idx ? 'bold' : 'normal', textShadow: '0 0 5px #8f00ff' }}>
                {p.name} ({p.hand.length} cards){p.phaseComplete ? ' ✅' : ''}
              </li>
            ))}
          </ul>

          {!game.started && <button onClick={startGame} style={buttonStyle}>Start Game</button>}

          {game.started && isMyTurn && (
            <div>
              <h3>Your Hand</h3>
              <div>
                {me.hand.map((card, i) => (
                  <button
                    key={i}
                    onClick={() => toggleSelect(card)}
                    style={{ ...buttonStyle, margin: 2, backgroundColor: selected.includes(card) ? '#8f00ff' : '#222' }}>
                    {card.color} {card.value}
                  </button>
                ))}
              </div>
              <div style={{ marginTop: 10 }}>
                <button onClick={() => draw('deck')} style={buttonStyle}>Draw from Deck</button>
                <button onClick={() => draw('discard')} style={buttonStyle}>Draw from Discard</button>
                <button onClick={layPhase} style={buttonStyle}>Lay Down Phase</button>
              </div>
            </div>
          )}

          <div style={{ marginTop: 20 }}>
            <h4>Chat</h4>
            <div style={{ border: '1px solid #444', height: 150, overflowY: 'scroll', padding: 10, backgroundColor: '#111' }}>
              {chatLog.map((line, i) => <p key={i}>{line}</p>)}
            </div>
            <input value={chatInput} onChange={e => setChatInput(e.target.value)} style={inputStyle} />
            <button onClick={sendChat} style={buttonStyle}>Send</button>
          </div>
        </>
      )}
    </div>
  );
}

const buttonStyle = {
  backgroundColor: '#222',
  color: '#00ffe7',
  border: '1px solid #00ffe7',
  padding: '10px 15px',
  margin: '5px',
  borderRadius: '5px',
  cursor: 'pointer',
  textShadow: '0 0 5px #00ffe7'
};

const inputStyle = {
  backgroundColor: '#111',
  color: '#fff',
  border: '1px solid #555',
  padding: '8px 12px',
  margin: '5px',
  borderRadius: '4px',
  width: '200px'
};

export default App;
