// === FRONTEND (React Component: App.js) with Neon Phase Theme ===
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
    audio.volume = 0.2;
    audio.play();
  };

  const playBGM = () => {
    const audio = new Audio('https://files.freemusicarchive.org/storage-freemusicarchive-org/music/no_curator/KieLoKaz/A_Wonderful_Kind_Of_Imperfect/KieLoKaz_-_07_-_Cyber_Raptor.mp3');
    audio.loop = true;
    audio.volume = 0.05;
    audio.play();
  };

  const me = game?.players.find(p => p.name === name);
  const isMyTurn = game?.players[game.currentTurn]?.name === name;

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Neon Phase 10</h1>

      {!game && (
        <div style={styles.centeredBox}>
          <input placeholder="Your name" value={name} onChange={e => setName(e.target.value)} style={styles.input} />
          <button onClick={createRoom} style={styles.button}>Create Room</button>
          <input placeholder="Room ID" value={roomId} onChange={e => setRoomId(e.target.value)} style={styles.input} />
          <button onClick={joinRoom} style={styles.button}>Join Room</button>
        </div>
      )}

      {game && (
        <>
          <div style={styles.status}>Room: {game.roomId}</div>
          <div style={styles.playersList}>
            {game.players.map((p, idx) => (
              <div key={p.id} style={{ fontWeight: game.currentTurn === idx ? 'bold' : 'normal' }}>
                {p.name} ({p.hand.length} cards){p.phaseComplete ? ' ✅' : ''}
              </div>
            ))}
          </div>

          {!game.started && <button onClick={startGame} style={styles.button}>Start Game</button>}

          {game.started && isMyTurn && (
            <>
              <h3 style={styles.sectionTitle}>Your Hand</h3>
              <div style={styles.cardRow}>
                {me.hand.map((card, i) => (
                  <div
                    key={i}
                    onClick={() => toggleSelect(card)}
                    style={{
                      ...styles.card,
                      background: selected.includes(card) ? 'linear-gradient(145deg,#ff00c8,#8f00ff)' : 'rgba(0,0,0,0.4)',
                      boxShadow: selected.includes(card) ? '0 0 15px #ff00c8' : '0 0 8px #00ffe7'
                    }}>
                    <div style={styles.cardText}>{card.color}</div>
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

          <div style={{ marginTop: 20 }}>
            <h4 style={styles.sectionTitle}>Chat</h4>
            <div style={styles.chatBox}>
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
    background: 'linear-gradient(180deg, #0e0e0e 0%, #1a1a1a 100%)',
    backgroundImage: 'url(https://images.unsplash.com/photo-1589782182194-81e6d5f637e0)',
    backgroundSize: 'cover',
    minHeight: '100vh',
    padding: 20,
    fontFamily: 'Orbitron, sans-serif',
    color: '#00ffe7'
  },
  title: {
    textAlign: 'center',
    fontSize: '3rem',
    color: '#ff00c8',
    textShadow: '0 0 20px #ff00c8',
    marginBottom: '2rem'
  },
  centeredBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  input: {
    backgroundColor: '#111',
    color: '#fff',
    border: '1px solid #555',
    padding: '10px',
    margin: '8px',
    borderRadius: '6px',
    width: '240px'
  },
  button: {
    backgroundColor: '#222',
    color: '#00ffe7',
    border: '1px solid #00ffe7',
    padding: '10px 20px',
    margin: '8px',
    borderRadius: '6px',
    cursor: 'pointer',
    textShadow: '0 0 5px #00ffe7'
  },
  status: {
    fontSize: '1.2rem',
    marginBottom: '1rem'
  },
  playersList: {
    marginBottom: '1rem'
  },
  sectionTitle: {
    color: '#ff00c8',
    marginTop: '1rem'
  },
  cardRow: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap'
  },
  card: {
    width: '80px',
    height: '120px',
    borderRadius: '10px',
    padding: '10px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontWeight: 'bold',
    color: '#fff',
    cursor: 'pointer'
  },
  cardText: {
    fontSize: '0.9em',
    opacity: 0.8
  },
  cardValue: {
    fontSize: '1.4em'
  },
  controls: {
    marginTop: '1rem'
  },
  chatBox: {
    background: '#000',
    border: '1px solid #333',
    padding: '10px',
    maxHeight: '150px',
    overflowY: 'scroll'
  }
};

export default App;
