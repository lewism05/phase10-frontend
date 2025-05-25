import React from 'react';

const NeonLogo = () => {
  return (
    <h1 style={styles.logo}>
      <span style={styles.glowPink}>Cyber</span>
      <span style={styles.glowTeal}>punk</span>
      <span style={styles.glowWhite}> 10</span>
    </h1>
  );
};

const styles = {
  logo: {
    fontFamily: 'Orbitron, sans-serif',
    fontSize: '4rem',
    textAlign: 'center',
    marginBottom: '1rem',
    animation: 'flicker 2s infinite alternate',
    color: '#fff'
  },
  glowPink: {
    color: '#ff00c8',
    textShadow: '0 0 10px #ff00c8, 0 0 20px #ff00c8'
  },
  glowTeal: {
    color: '#00ffe7',
    textShadow: '0 0 10px #00ffe7, 0 0 20px #00ffe7'
  },
  glowWhite: {
    color: '#ffffff',
    textShadow: '0 0 10px #fff, 0 0 20px #ccc'
  }
};

export default NeonLogo;
