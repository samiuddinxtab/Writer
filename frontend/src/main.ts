// Main entry point for the Urdu Articles App
import './styles/global.css';
import './styles/components.css';
import App from './App.svelte';

const app = new App({
  target: document.getElementById('app')!,
});

export default app;
