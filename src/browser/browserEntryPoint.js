import MyGameEngine from '../common/MyGameEngine';
import BrowserHostRuntime from './HostRuntime';
import LoopbackTransport from './LoopbackTransport';

function createLocalRuntime() {
    const gameEngine = new MyGameEngine({ traceLevel: 0, updateRate: 6 });
    const transport = new LoopbackTransport();
    return new BrowserHostRuntime({
        gameEngine,
        transport,
        tickRate: 6,
        roomCode: 'local-room',
    });
}

window.addEventListener('load', () => {
    const startButton = document.getElementById('startGame');
    const comment = document.getElementById('comment');
    const session = { runtime: null };

    if (!startButton) {
        return;
    }

    startButton.addEventListener('click', () => {
        if (!session.runtime) {
            session.runtime = createLocalRuntime();
            window.__lavaHostRuntime = session.runtime;
        }

        if (session.runtime.status !== 'running') {
            session.runtime.start();
        }

        if (session.runtime.players.has('local-player')) {
            session.runtime.removePlayer('local-player');
        }

        session.runtime.addPlayer('local-player');
        startButton.textContent = 'Restart game';
        comment.textContent = 'Local host session is running.';
    });
});
