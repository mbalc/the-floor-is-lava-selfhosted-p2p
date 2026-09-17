export default class LoopbackTransport {
    constructor() {
        this.messages = [];
        this.handlers = [];
        this.runtime = null;
    }

    attach(runtime) {
        this.runtime = runtime;
        return this;
    }

    onMessage(handler) {
        this.handlers.push(handler);
        return () => {
            this.handlers = this.handlers.filter((current) => current !== handler);
        };
    }

    emit(message) {
        const envelope = Object.assign({
            sentAt: Date.now(),
            direction: 'host->runtime',
        }, message);

        this.messages.push(envelope);
        this.handlers.forEach((handler) => handler(envelope));

        if (this.runtime && typeof this.runtime.onTransportMessage === 'function') {
            this.runtime.onTransportMessage(envelope);
        }

        return envelope;
    }

    send(message) {
        return this.emit(Object.assign({ type: 'message' }, message));
    }

    receive(message) {
        return this.emit(Object.assign({
            direction: 'runtime->host',
        }, message));
    }
}
