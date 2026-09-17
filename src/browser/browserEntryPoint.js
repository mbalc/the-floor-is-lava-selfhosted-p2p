import MyGameEngine from '../common/MyGameEngine';
import BrowserHostRuntime from './HostRuntime';
import LoopbackTransport from './LoopbackTransport';

window.addEventListener('load', () => {
    const gameEngine = new MyGameEngine({ traceLevel: 0, updateRate: 6 });
    const transport = new LoopbackTransport();
    const runtime = new BrowserHostRuntime({
        gameEngine,
        transport,
        tickRate: 6,
        roomCode: 'local-room',
    });

    runtime.start();
    runtime.addPlayer('local-player');

    if (window) {
        window.__lavaHostRuntime = runtime;
    }
});
