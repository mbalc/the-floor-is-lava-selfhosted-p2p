import LoopbackTransport from './LoopbackTransport';

export default class BrowserHostRuntime {
    constructor({ gameEngine, transport, tickRate = 6, roomCode = 'local-room' } = {}) {
        this.gameEngine = gameEngine;
        this.transport = transport || new LoopbackTransport();
        this.tickRate = tickRate;
        this.roomCode = roomCode;
        this.players = new Map();
        this.status = 'idle';
        this.sequence = 0;

        this.transport.attach(this);
    }

    start() {
        if (!this.gameEngine) {
            throw new Error('BrowserHostRuntime requires a gameEngine instance');
        }

        if (this.status === 'running') {
            return this;
        }

        this.gameEngine.start();
        if (typeof this.gameEngine.initGame === 'function') {
            this.gameEngine.initGame();
        }

        this.status = 'running';
        this.transport.emit({
            type: 'sessionStarted',
            roomCode: this.roomCode,
            tickRate: this.tickRate,
            status: this.status,
        });

        return this;
    }

    addPlayer(playerKey = `player-${Date.now()}`) {
        const playerId = String(playerKey || `player-${Date.now()}-${this.sequence++}`);
        this.players.set(playerId, { id: playerId, label: playerKey });

        if (this.gameEngine && typeof this.gameEngine.addPlayer === 'function') {
            this.gameEngine.addPlayer(playerId);
        }

        this.transport.emit({
            type: 'playerJoined',
            playerId,
            label: playerKey,
        });

        return playerId;
    }

    removePlayer(playerId) {
        this.players.delete(playerId);

        if (this.gameEngine && typeof this.gameEngine.removePlayer === 'function') {
            this.gameEngine.removePlayer(playerId);
        }

        this.transport.emit({
            type: 'playerLeft',
            playerId,
        });
    }

    handleInput(inputData, playerId = 'local-player') {
        if (!this.gameEngine || typeof this.gameEngine.processInput !== 'function') {
            return null;
        }

        this.gameEngine.processInput(inputData, playerId, true);
        this.transport.emit({
            type: 'input',
            playerId,
            input: inputData,
            tick: this.sequence,
        });

        return this;
    }

    onTransportMessage(message) {
        if (message && message.type === 'input' && message.playerId) {
            this.handleInput(message.input, message.playerId);
        }
    }

    getSessionState() {
        return {
            status: this.status,
            roomCode: this.roomCode,
            tickRate: this.tickRate,
            players: Array.from(this.players.values()),
            playerCount: this.players.size,
        };
    }

    stop() {
        this.status = 'stopped';
        this.transport.emit({
            type: 'sessionStopped',
            roomCode: this.roomCode,
            status: this.status,
        });
        return this;
    }
}
