import React, { useEffect, useState } from 'react';
import socketClient from 'socket.io-client';

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

  if (!game) {
    return (
      <div>
        <h1>Phase 10 Online</h1>
        <input placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
        <button onClick={createRoom}>Create Room</button>
        <input placeholder="Room ID" value={roomId} onChange={e => setRoomId(e.target.value)} />
        <button onClick={joinRoom}>Join Room</button>
      </div>
    );
  }

 return (
  <div style={{ padding: 20 }}>
    <h2>Room: {game.roomId}</h2>
    <h3>Players:</h3>
    <ul>
      {game.players.map((p, idx) => (
        <li key={p.id} style={{ fontWeight: game.currentTurn === idx ? 'bold' : 'normal' }}>
          {p.name} ({p.hand.length} cards){p.phaseComplete ? ' ✅' : ''}
        </li>
      ))}
    </ul>
    {!game.started && <button onClick={startGame}>Start Game</button>}

    {game.started && isMyTurn && (
      <div>
        <h3>Your Hand</h3>
        <div>
          {me.hand.map((card, i) => (
            <button
              key={i}
              onClick={() => toggleSelect(card)}
              style={{
                margin: 2,
                backgroundColor: selected.includes(card) ? 'lightgreen' : ''
              }}
            >
              {card.color} {card.value}
            </button>
          ))}
        </div>
        <div style={{ marginTop: 10 }}>
          <button onClick={() => draw('deck')}>Draw from Deck</button>
          <button onClick={() => draw('discard')}>Draw from Discard</button>
          <button onClick={layPhase}>Lay Down Phase</button>
        </div>
      </div>
    )}

    <div style={{ marginTop: 20 }}>
      <h4>Chat</h4>
      <div style={{ border: '1px solid #ccc', height: 150, overflowY: 'scroll', padding: 10 }}>
        {chatLog.map((line, i) => <p key={i}>{line}</p>)}
      </div>
      <input value={chatInput} onChange={e => setChatInput(e.target.value)} />
      <button onClick={sendChat}>Send</button>
    </div>
    </div>
 );
}

export default App;
