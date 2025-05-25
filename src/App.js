// === FRONTEND (React Component: App.js) with Hugging Face Cyberpunk Theme ===
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
    <div className="min-h-screen bg-[#0a0a1a] text-[#e0e0ff] font-['Rajdhani'] grid-pattern p-6">
      <h1 className="text-center text-5xl font-bold neon-text font-['Orbitron'] mb-6">Cyberpunk 10</h1>

      {!game && (
        <div className="flex flex-col items-center gap-4">
          <input
            className="w-64 p-3 rounded bg-[#111] text-white border border-cyan-500"
            placeholder="Your name"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <button onClick={createRoom} className="neon-button px-6 py-3 rounded">Create Room</button>
          <input
            className="w-64 p-3 rounded bg-[#111] text-white border border-cyan-500"
            placeholder="Room ID"
            value={roomId}
            onChange={e => setRoomId(e.target.value)}
          />
          <button onClick={joinRoom} className="neon-button px-6 py-3 rounded">Join Room</button>
        </div>
      )}

      {game && (
        <>
          <div className="text-center mt-4 text-lg">Room ID: {game.roomId}</div>
          <div className="flex flex-wrap justify-center gap-4 my-4">
            {game.players.map((p, idx) => (
              <div key={p.id} className="text-cyan-300">
                {p.name} ({p.hand.length}){p.phaseComplete ? ' ✅' : ''}
              </div>
            ))}
          </div>

          {!game.started && (
            <div className="text-center">
              <button onClick={startGame} className="neon-button px-6 py-3 rounded">Start Game</button>
            </div>
          )}

          {game.started && isMyTurn && (
            <div className="mt-8">
              <h2 className="text-center text-xl font-bold text-purple-400 mb-4">Your Hand</h2>
              <div className="flex flex-wrap justify-center gap-4">
                {me.hand.map((card, i) => (
                  <div
                    key={i}
                    onClick={() => toggleSelect(card)}
                    className="cyberpunk-card cursor-pointer"
                    style={{
                      background: selected.includes(card)
                        ? 'linear-gradient(135deg,#ff00f0,#00f0ff)'
                        : undefined,
                      transform: selected.includes(card)
                        ? 'translateY(-10px) scale(1.05)'
                        : undefined
                    }}
                  >
                    {card.value}
                  </div>
                ))}
              </div>
              <div className="flex justify-center gap-4 mt-6">
                <button onClick={() => draw('deck')} className="neon-button px-5 py-2 rounded">Draw Deck</button>
                <button onClick={() => draw('discard')} className="neon-button px-5 py-2 rounded">Draw Discard</button>
                <button onClick={layPhase} className="neon-button px-5 py-2 rounded">Lay Phase</button>
              </div>
            </div>
          )}

          <div className="mt-12">
            <h3 className="text-center text-xl font-bold text-purple-400 mb-4">Chat</h3>
            <div className="max-w-xl mx-auto bg-[#111] p-4 rounded border border-cyan-500 max-h-40 overflow-y-scroll">
              {chatLog.map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
            <div className="flex justify-center gap-4 mt-4">
              <input
                className="w-64 p-2 rounded bg-[#111] text-white border border-cyan-500"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
              />
              <button onClick={sendChat} className="neon-button px-4 py-2 rounded">Send</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
