import { GameManager } from './core/GameManager.js';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  const uiRoot = document.getElementById('ui-overlay');

  if (!canvas || !uiRoot) {
    console.error('Game canvas or UI root missing');
    return;
  }

  // eslint-disable-next-line no-new
  new GameManager({ canvas, uiRoot });
});
