import Peer, { DataConnection } from 'peerjs'
import type { GameState, RemoteGameAction } from '../types/game'

const PEER_PREFIX = 'wordchicken-'

/** Generate a short lobby code (5 uppercase alphanumeric chars) */
export function generateLobbyCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no I/O/0/1 to avoid confusion
  let code = ''
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export function lobbyCodeToPeerId(code: string): string {
  return PEER_PREFIX + code.toUpperCase()
}

export type MultiplayerMessage =
  | { type: 'game-state'; state: SerializedGameState }
  | { type: 'action'; action: RemoteGameAction }
  | { type: 'start-game' }
  | { type: 'opponent-quit' }

/** GameState without the dictionary Set (can't serialize Sets) */
export type SerializedGameState = Omit<GameState, 'config'> & {
  config: Omit<GameState['config'], 'dictionary'>
}

/** Strip the dictionary from game state for network transfer */
export function serializeGameState(state: GameState): SerializedGameState {
  const { dictionary: _dict, ...configWithoutDict } = state.config
  return {
    ...state,
    config: configWithoutDict,
  }
}

/** Restore the dictionary reference to a received game state */
export function deserializeGameState(
  serialized: SerializedGameState,
  dictionary: Set<string>
): GameState {
  return {
    ...serialized,
    config: {
      ...serialized.config,
      dictionary,
    },
  }
}

// --- Module-level connection state (shared across all hook instances) ---

let _peer: Peer | null = null
let _conn: DataConnection | null = null
let _onData: ((msg: MultiplayerMessage) => void) | null = null
let _onDisconnect: (() => void) | null = null

/** Send a message to the connected peer */
export function sendMessage(msg: MultiplayerMessage): void {
  if (_conn && _conn.open) {
    _conn.send(msg)
  }
}

/** Register the handler for incoming messages */
export function setMessageHandler(handler: (msg: MultiplayerMessage) => void): void {
  _onData = handler
}

/** Register the handler for disconnection */
export function setDisconnectHandler(handler: () => void): void {
  _onDisconnect = handler
}

function wireConnection(conn: DataConnection): void {
  _conn = conn

  conn.on('data', (raw) => {
    if (_onData) {
      _onData(raw as MultiplayerMessage)
    }
  })

  conn.on('close', () => {
    if (_onDisconnect) {
      _onDisconnect()
    }
  })
}

/** Create a host peer that waits for a guest to connect. */
export function createHostPeer(
  lobbyCode: string,
  onConnection: () => void,
  onError: (err: Error) => void,
  onOpen: () => void,
): void {
  destroyPeer()
  const peerId = lobbyCodeToPeerId(lobbyCode)
  const peer = new Peer(peerId)
  _peer = peer

  peer.on('open', onOpen)

  peer.on('connection', (conn) => {
    conn.on('open', () => {
      wireConnection(conn)
      onConnection()
    })
  })

  peer.on('error', (err) => {
    onError(err as unknown as Error)
  })
}

/** Connect to a host peer as a guest. */
export function connectToHostPeer(
  lobbyCode: string,
  onConnection: () => void,
  onError: (err: Error) => void,
): void {
  destroyPeer()
  const peer = new Peer()
  _peer = peer

  peer.on('open', () => {
    const hostPeerId = lobbyCodeToPeerId(lobbyCode)
    const conn = peer.connect(hostPeerId, { reliable: true })

    conn.on('open', () => {
      wireConnection(conn)
      onConnection()
    })

    conn.on('error', (err) => {
      onError(err as unknown as Error)
    })
  })

  peer.on('error', (err) => {
    onError(err as unknown as Error)
  })
}

/** Destroy the peer connection and clean up */
export function destroyPeer(): void {
  _conn?.close()
  _conn = null
  _peer?.destroy()
  _peer = null
  _onData = null
  _onDisconnect = null
}
