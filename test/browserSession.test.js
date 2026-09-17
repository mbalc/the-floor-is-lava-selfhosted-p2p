import assert from 'assert';
import BrowserHostRuntime from '../src/browser/HostRuntime';
import LoopbackTransport from '../src/browser/LoopbackTransport';
import MyGameEngine from '../src/common/MyGameEngine';

describe('browser session bootstrap', () => {
    it('creates a host runtime that accepts a local player and exposes a loopback transport', () => {
        const gameEngine = new MyGameEngine({ traceLevel: 0 });
        const transport = new LoopbackTransport();
        const runtime = new BrowserHostRuntime({ gameEngine, transport, tickRate: 6 });

        runtime.start();
        const playerId = runtime.addPlayer('local-player');

        assert.ok(runtime.gameEngine === gameEngine);
        assert.strictEqual(typeof playerId, 'string');
        assert.ok(runtime.getSessionState().status === 'running');
        assert.ok(Array.isArray(transport.messages));
        assert.ok(typeof runtime.handleInput === 'function');

        runtime.stop();
    });
});
