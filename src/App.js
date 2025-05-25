// === FRONTEND (React Component: App.js) - Cyberpunk Ultra Redesign ===
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
    playBGM();
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
    audio.volume = 0.3;
    audio.play();
  };

  const playBGM = () => {
    const audio = new Audio('https://files.freemusicarchive.org/storage-freemusicarchive-org/music/no_curator/Lee_Rosevere/Music_For_Podcasts_5/Lee_Rosevere_-_03_-_Quizitive.mp3');
    audio.loop = true;
    audio.volume = 0.1;
    audio.play();
  };

  const me = game?.players.find(p => p.name === name);
  const isMyTurn = game?.players[game.currentTurn]?.name === name;

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Cyberpunk 10</h1>

      {!game && (
        <div style={styles.centerBox}>
          <input placeholder="Your name" value={name} onChange={e => setName(e.target.value)} style={styles.input} />
          <button onClick={createRoom} style={styles.button}>Create Room</button>
          <input placeholder="Room ID" value={roomId} onChange={e => setRoomId(e.target.value)} style={styles.input} />
          <button onClick={joinRoom} style={styles.button}>Join Room</button>
        </div>
      )}

      {game && (
        <>
          <div style={styles.status}>Room: {game.roomId}</div>
          <div style={styles.playerList}>
            {game.players.map((p, idx) => (
              <div key={p.id} style={{ fontWeight: game.currentTurn === idx ? 'bold' : 'normal' }}>
                {p.name} ({p.hand.length} cards){p.phaseComplete ? ' ✅' : ''}
              </div>
            ))}
          </div>

          {!game.started && <button onClick={startGame} style={styles.button}>Start Game</button>}

          {game.started && isMyTurn && (
            <>
              <h3 style={styles.section}>Your Hand</h3>
              <div style={styles.cardRow}>
                {me.hand.map((card, i) => (
                  <div
                    key={i}
                    onClick={() => toggleSelect(card)}
                    style={{
                      ...styles.card,
                      background: selected.includes(card) ? 'linear-gradient(to bottom right, #ff00c8, #8f00ff)' : 'rgba(20,20,20,0.7)',
                      transform: selected.includes(card) ? 'scale(1.05)' : 'scale(1)'
                    }}>
                    <div style={styles.cardTop}>{card.color}</div>
                    <div style={styles.cardValue}>{card.value}</div>
                  </div>
                ))}
              </div>
              <div style={styles.controls}>
                <button onClick={() => draw('deck')} style={styles.button}>Draw Deck</button>
                <button onClick={() => draw('discard')} style={styles.button}>Draw Discard</button>
                <button onClick={layPhase} style={styles.button}>Lay Phase</button>
              </div>
            </>
          )}

          <div style={styles.chatBox}>
            <h4 style={styles.section}>Chat</h4>
            <div style={styles.chatWindow}>
              {chatLog.map((line, i) => <p key={i}>{line}</p>)}
            </div>
            <input value={chatInput} onChange={e => setChatInput(e.target.value)} style={styles.input} />
            <button onClick={sendChat} style={styles.button}>Send</button>
          </div>
        </>
      )}
    </div>
  );
}

const styles = {
  page: {
    background: 'linear-gradient(to bottom, #0f0c29, #302b63, #24243e)',
    minHeight: '100vh',
    padding: 30,
    fontFamily: 'Orbitron, sans-serif',
    color: '#00ffe7',
    backgroundSize: 'cover',
    backgroundAttachment: 'fixed'
  },
  title: {
    textAlign: 'center',
    fontSize: '3.5rem',
    color: '#ff00c8',
    textShadow: '0 0 15px #ff00c8'
  },
  centerBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: '2rem'
  },
  input: {
    backgroundColor: '#222',
    color: '#fff',
    border: '2px solid #00ffe7',
    padding: '12px 20px',
    margin: '8px',
    borderRadius: '6px',
    width: '280px',
    fontSize: '1.1rem'
  },
  button: {
    background: 'linear-gradient(to right, #ff00c8, #8f00ff)',
    color: '#fff',
    border: 'none',
    padding: '12px 20px',
    margin: '8px',
    borderRadius: '6px',
    fontSize: '1rem',
    cursor: 'pointer',
    boxShadow: '0 0 10px #ff00c8'
  },
  status: {
    fontSize: '1.2rem',
    margin: '1rem 0'
  },
  playerList: {
    marginBottom: '1rem'
  },
  section: {
    fontSize: '1.3rem',
    marginTop: '1rem',
    color: '#ff00c8'
  },
  cardRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '15px',
    marginTop: '1rem'
  },
  card: {
    width: '100px',
    height: '140px',
    borderRadius: '12px',
    padding: '10px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: '#fff',
    fontWeight: 'bold',
    transition: 'all 0.2s ease-in-out',
    boxShadow: '0 0 10px rgba(255,255,255,0.2)'
  },
  cardTop: {
    fontSize: '0.9rem',
    opacity: 0.8
  },
  cardValue: {
    fontSize: '2rem',
    marginTop: '10px'
  },
  controls: {
    marginTop: '1rem'
  },
  chatBox: {
    marginTop: '2rem'
  },
  chatWindow: {
    background: '#111',
    border: '1px solid #444',
    padding: '10px',
    height: '150px',
    overflowY: 'scroll'
  }
};

export default App;
