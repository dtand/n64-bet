import React, { useState } from 'react';
import './App.css';
import './index.css';
import 'react-notifications/lib/notifications.css';
import N64Bet from './N64Bet';

function App() {

  const [isOpen, setIsOpen] = useState(false);
  const toggle = () => setIsOpen(!isOpen);

  return (
    <N64Bet/>
  );
}

export default App;
