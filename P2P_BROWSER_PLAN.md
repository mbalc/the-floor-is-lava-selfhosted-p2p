# Browser Host and Peer-to-Peer Multiplayer Plan

## Goal

Run the game entirely from browser bundles so that:

- one browser tab creates a room and owns the authoritative game simulation;
- other browser tabs join that room through a shareable room code or URL;
- gameplay traffic travels directly between browsers over WebRTC data channels;
- a small signaling service is used only to help peers discover each other and exchange WebRTC connection metadata;
- no Node.js game server or Socket.IO game transport is required at runtime.
- the whole game can be built into static assets and deployed through GitHub Pages.

The host is authoritative. This is a host-authoritative multiplayer game, not a fully distributed simulation: clients send input, the host advances `MyGameEngine`, and the host sends snapshots/events back to peers.

## GitHub Pages Static Hosting Constraint

GitHub Pages can only serve static files. It cannot host the current Express + Socket.IO runtime or a persistent game-authoritative Node process. Therefore the migration must be framed as a static client build, not as a server-backed game app.

The repository should target a static output like:

- `dist/index.html`
- `dist/assets/...`
- `dist/bundle.js`
- optionally a `manifest.json`, `robots.txt`, or share metadata

The app should still support the same flow:

1. A user opens the GitHub Pages site in a browser.
2. That browser tab chooses "Host session" or "Join session".
3. The host tab creates a room with Trystero and starts the authoritative simulation.
4. Peer tabs join via room code or URL.
5. Gameplay traffic uses WebRTC data channels. The only network dependency outside GitHub Pages is the signaling service required by Trystero/WebRTC.

This means the GitHub Pages project is a static frontend only. The actual room/session coordination happens inside the browser and relies on an external signaling service or self-hosted relay endpoint.

## Static Build Strategy

Target a webpack or Vite build that emits a pure frontend bundle with no server-side code paths:

- no `express` server startup in the browser bundle;
- no `socket.io` client script in the page;
- no Node-only modules used at runtime in the browser;
- no filesystem or process access from the UI layer;
- no direct dependency on `localhost:3000` or in-repo Node server endpoints.

The compiled site must be deployable by pushing the static output to a GitHub Pages branch or using a GitHub Actions workflow that publishes `dist/` to Pages.

## GitHub Pages Delivery Requirements

When the project is ready for deployment, the static delivery path should satisfy all of the following:

- The built app works from a static URL under GitHub Pages.
- A browser tab can open the host page without a backend process running.
- The host can list or generate a room code and expose a shareable join link.
- The peer can join using a room code without requiring a Node server on the same domain.
- HTTPS is available, because WebRTC and browser security rules generally require a secure context.
- A signaling endpoint is reachable and configured for the public deployment; this is the only piece that cannot live inside Pages itself.

## Deployment Considerations for Real P2P

GitHub Pages itself is not a full multiplayer backend. The app should therefore operate under this model:

- GitHub Pages hosts the static client code.
- Host browser tab is the real authoritative server for a session.
- WebRTC peers connect directly to the host after signaling.
- A free or external signaling relay is used for WebRTC handshake metadata.
- If the host tab closes, the room ends unless a separate relay server keeps session state alive.

This is a perfect fit for a local-party/self-hosted game, but it is not a fully persistent online game backend. The GitHub Pages deployment should be documented as a static client with browser-hosted sessions, not as a full app server.

## Current Starting Point

- `main.js` serves the page and creates Lance's `MyServerEngine` around Socket.IO.
- `src/client/clientEntryPoint.js` creates a Lance `ClientEngine` in the browser.
- `src/common/MyGameEngine.js` contains the shared physics, player input, collisions, shooting, and level generation logic.
- `MyGameEngine.initGame()` and the `server__postStep` listener currently make level generation server-only.
- `src/client/MyClientEngine.js` still assumes a Socket.IO-backed Lance client, including `this.socket.emit('requestRestart')`.
- Trystero is already listed as a dependency but is not imported or used.
- `index.html` explicitly loads `/socket.io/socket.io.js`, which must disappear from the browser-only build.

## Recommended Architecture

### 1. Keep the simulation model, replace the server boundary

Keep `MyGameEngine`, the model classes, serializers, renderer, and input mappings as the initial shared foundation. Add a browser host runtime that:

1. creates `MyGameEngine` with host/server options;
2. calls `start()` and `initGame()`;
3. assigns stable peer/player IDs;
4. receives validated input messages from connected peers;
5. calls `processInput(input, playerId, true)` on the host;
6. advances the simulation at the configured update rate;
7. publishes authoritative state updates and lifecycle messages.

Do not try to make Trystero pretend to be Lance's Socket.IO object. Put a small transport/session adapter between the P2P layer and game runtime. This keeps room management and WebRTC details out of `MyGameEngine` and makes disconnect/reconnect behavior testable.

### 2. Use Trystero for room signaling and data channels

Use a Trystero room provider that works in the target deployment environment. The room code should be an opaque, user-shareable identifier. Trystero's signaling service is a bootstrap dependency only; game messages must use its peer data channels after a connection is established.

Define separate message families/channels:

- `hello`: protocol version, peer ID, display name, and requested role;
- `welcome`: assigned player ID, current tick, game version, and initial snapshot;
- `input`: keyboard, mouse, and restart requests from a peer to the host;
- `snapshot`: authoritative serialized world state from the host;
- `event`: join/leave, object destruction, game-over, and other UI-relevant events;
- `ping`/`pong`: latency and connection health measurement.

Use reliable ordered delivery for join, input, restart, and lifecycle messages. Snapshot delivery can be optimized later, but the first implementation should favor correctness and explicit sequence/tick numbers over premature compression.

### 3. Split browser roles explicitly

Add a session/bootstrap layer with two modes:

- **Host mode:** create a room, start the host simulation, display the room code, and expose the host's local player through the same input path as peers.
- **Peer mode:** join a room, wait for `welcome` and the initial snapshot, send local input, and render host snapshots without running authoritative simulation.

The UI should show room state (`creating`, `waiting`, `connected`, `disconnected`), the room code/share link, the local player ID, and a clear host-disconnected state. A host tab closing ends the session; this is an explicit product constraint to document.

### 4. Treat Lance as an implementation boundary, not the network protocol

First determine which Lance APIs can be reused without `ServerEngine` and `ClientEngine` socket assumptions. If they cannot consume externally supplied snapshots cleanly, introduce thin `BrowserHostEngine` and `BrowserPeerEngine` wrappers rather than modifying vendor code broadly.

The likely first milestone is to reuse the game objects and renderer while defining a minimal snapshot codec/adapter. Later, Lance synchronization or interpolation can be reintroduced behind that adapter if it provides value. The wire format must be versioned so a stale browser bundle cannot silently interpret a newer snapshot incorrectly.

## Implementation Phases

### Phase 0: Establish a browser-only baseline

- Confirm the current build and runtime commands and add a browser entry path that does not require `main.js`.
- Remove the page's Socket.IO script dependency once the replacement path is ready.
- Separate browser-safe shared code from Node-only serving code.
- Add a development static server command for serving `index.html` and `dist/`.
- Configure the static build output to be compatible with GitHub Pages: `index.html` at the site root, bundled JS/CSS under `assets/` or `dist/`, no server-side entrypoints.

**Exit check:** one browser can load the bundle, start a local game, render a level, and play without Express, Socket.IO, or a Node game process; the output is deployable as static files.

### Phase 1: Extract a local host runtime

- Move `initGame()` and the level generator's per-step work behind an explicit host runtime hook instead of relying on `server__postStep`.
- Define one simulation clock/tick source and make host input processing use the same code path for local and remote players.
- Add host-side player registration/removal and restart handling, replacing `MyServerEngine` socket callbacks.
- Add snapshot creation/restoration for the world state, including object IDs, player ownership, tick number, and game phase.

**Exit check:** host mode supports two local/test players and can restart a player without any socket object.

### Phase 2: Add Trystero session transport

- Add a `P2PSession` adapter responsible for room creation/joining, peer lifecycle, channel setup, message validation, and teardown.
- Add a protocol module containing message types, protocol version, maximum payload sizes, and schema validation.
- Route host input messages into the host runtime and route host snapshots/events to peers.
- Include monotonic tick/sequence numbers and reject malformed, stale, or oversized messages.

**Exit check:** two browser tabs can create/join a room, complete the handshake, exchange ping messages, and receive an initial snapshot.

### Phase 3: Connect gameplay and UI

- Replace `MyClientEngine`'s direct socket restart call with a session command.
- Route keyboard and mouse input through the P2P adapter.
- Render host snapshots on peers and preserve client-side interpolation only after correctness is established.
- Add room creation/join controls, shareable room links, connection status, and host-disconnect handling.
- Ensure a peer cannot claim another peer's player ID or mutate authoritative state.

**Exit check:** two real browser tabs can move, jump, shoot, collect items, die, and restart in one shared room.

### Phase 4: Reliability, security, and deployment

- Handle late joins, duplicate messages, peer reconnection, host shutdown, and incompatible protocol versions.
- Add rate limits and input validation on the host; never trust client positions, collisions, scores, or inventory.
- Decide whether rooms are public, protected by a short-lived room secret, or discoverable only through an invite link.
- Select and document the Trystero signaling provider, its availability assumptions, and any TURN server requirement for restrictive NATs.
- Add production static hosting and HTTPS, which is required for WebRTC outside secure local development contexts.
- Remove unused Socket.IO/server dependencies only after the browser path is the default and verified.

**Exit check:** a deployed HTTPS build works across separate networks where WebRTC can establish a route, and failure states provide actionable UI.

## Snapshot and Timing Decisions

Start with a host snapshot at every simulation tick or a conservative fixed interval. Each snapshot should include:

- protocol/game version;
- authoritative tick and timestamp;
- all synchronized object state required by the renderer;
- local player assignment and game phase;
- events that must be consumed exactly once, with event IDs.

Peers should render the newest valid host state and may interpolate between snapshots. They should not advance gameplay rules independently until there is a demonstrated need. The host should use a fixed timestep and cap catch-up work so a stalled tab does not create an unbounded burst.

## Testing and Validation

Add focused tests before optimizing:

- protocol validation accepts valid messages and rejects unknown versions, oversized payloads, invalid player IDs, and malformed input;
- snapshot round-trip preserves object identity, ownership, positions, weapons, and game phase;
- host input processing is deterministic for a fixed input/tick sequence;
- join, leave, restart, duplicate join, and host shutdown state transitions are correct;
- two automated browser contexts can create/join a room and verify that a movement and a game event appear on both views;
- manual matrix: same machine, separate LAN devices, separate networks, refresh during join, and host tab close.

Record browser and signaling prerequisites in `README.md` when implementation starts. Keep a local/mock transport for deterministic tests so unit tests do not depend on a public signaling service.

## Main Risks and Decisions to Resolve Early

1. **Lance coupling:** verify whether the current Lance version exposes enough public APIs for external snapshot application. If not, use a narrow adapter rather than rewriting the game model.
2. **Signaling availability:** WebRTC is not self-discovering. The deployment needs a reachable signaling provider, and some network pairs need TURN relay support even though gameplay is intended to be P2P.
3. **Host authority:** the host can cheat or terminate the game. This is acceptable for a self-hosted party game, but must be stated in the UI/docs.
4. **Browser throttling:** background tabs may throttle timers. Use visibility-aware connection status and host tick safeguards; do not assume a background host is reliable.
5. **Payload size:** full serialized worlds may be larger than expected. Measure snapshots first, then add delta compression or interest management only if profiling shows it is needed.

## Suggested First Coding Slice

Create the browser session abstraction and local host runtime first, without WebRTC. Make the current game run through `HostRuntime` plus a `LoopbackTransport`, then replace only the transport with Trystero. This gives a cheap way to validate player registration, input routing, snapshots, and restart behavior before network timing and NAT traversal complicate debugging.