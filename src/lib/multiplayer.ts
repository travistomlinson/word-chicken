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
  | { type: 'start-game'; config: SerializedGameConfig }
  | { type: 'rematch'; config: SerializedGameConfig }
  | { type: 'opponent-quit' }

/** GameState without the dictionary Set (can't serialize Sets) */
export type SerializedGameState = Omit<GameState, 'config'> & {
  config: Omit<GameState['config'], 'dictionary'>
}

export type SerializedGameConfig = Omit<GameState['config'], 'dictionary'>

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

export interface PeerConnection {
  peer: Peer
  connection: DataConnection | null
  destroy: () => void
}

/**
 * Create a host peer that waits for a guest to connect.
 */
export function createHost(
  lobbyCode: string,
  onConnection: (conn: DataConnection) => void,
  onError: (err: Error) => void,
  onOpen: () => void,
): PeerConnection {
  const peerId = lobbyCodeToPeerId(lobbyCode)
  const peer = new Peer(peerId)
  let connection: DataConnection | null = null

  peer.on('open', () => {
    onOpen()
  })

  peer.on('connection', (conn) => {
    connection = conn
    onConnection(conn)
  })

  peer.on('error', (err) => {
    onError(err as unknown as Error)
  })

  return {
    peer,
    get connection() { return connection },
    destroy: () => {
      connection?.close()
      peer.destroy()
    },
  }
}

/**
 * Connect to a host peer as a guest.
 */
export function connectToHost(
  lobbyCode: string,
  onConnection: (conn: DataConnection) => void,
  onError: (err: Error) => void,
): PeerConnection {
  const peer = new Peer()
  let connection: DataConnection | null = null

  peer.on('open', () => {
    const hostPeerId = lobbyCodeToPeerId(lobbyCode)
    const conn = peer.connect(hostPeerId, { reliable: true })

    conn.on('open', () => {
      connection = conn
      onConnection(conn)
    })

    conn.on('error', (err) => {
      onError(err as unknown as Error)
    })
  })

  peer.on('error', (err) => {
    onError(err as unknown as Error)
  })

  return {
    peer,
    get connection() { return connection },
    destroy: () => {
      connection?.close()
      peer.destroy()
    },
  }
}
