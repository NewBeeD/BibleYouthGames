import { io } from 'socket.io-client'

let socketInstance = null

export const getPvpServerUrl = () => {
  if(typeof window !== 'undefined'){
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:'
    const hostname = window.location.hostname || 'localhost'
    const pathname = window.location.pathname || '/'
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0'
    const hasExplicitPort = Boolean(window.location.port)
    const isBackendPort = window.location.port === '4000'
    const isGatewayMounted = pathname.startsWith('/bibletimeline')

    if(isGatewayMounted){
      return window.location.origin
    }

    if(process.env.REACT_APP_PVP_SERVER_URL){
      return process.env.REACT_APP_PVP_SERVER_URL
    }

    if(isLocalhost && !isBackendPort){
      return `${protocol}//${hostname}:4000`
    }

    if(hasExplicitPort && !isBackendPort){
      return `${protocol}//${hostname}:4000`
    }

    return window.location.origin
  }

  if(process.env.REACT_APP_PVP_SERVER_URL){
    return process.env.REACT_APP_PVP_SERVER_URL
  }

  return 'http://localhost:4000'
}

const getPvpSocketPath = () => {
  if(typeof window !== 'undefined' && window.location.pathname.startsWith('/bibletimeline')){
    return '/bibletimeline/socket.io'
  }

  return '/socket.io'
}

export const getPvpSocket = () => {
  if(socketInstance){
    return socketInstance
  }

  const serverUrl = getPvpServerUrl()
  socketInstance = io(serverUrl, {
    path: getPvpSocketPath(),
    transports: ['polling', 'websocket'],
    autoConnect: true,
    timeout: 7000,
    reconnection: true,
    reconnectionDelay: 600,
    reconnectionDelayMax: 5000
  })

  return socketInstance
}

export const ensurePvpSocketConnected = (connectTimeoutMs = 7000) => {
  const socket = getPvpSocket()

  if(socket.connected){
    return Promise.resolve(socket)
  }

  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      socket.off('connect', handleConnect)
      socket.off('connect_error', handleError)
      reject(new Error('Could not connect to PvP server'))
    }, connectTimeoutMs)

    const handleConnect = () => {
      clearTimeout(timeoutId)
      socket.off('connect_error', handleError)
      resolve(socket)
    }

    const handleError = () => {
      clearTimeout(timeoutId)
      socket.off('connect', handleConnect)
      reject(new Error('Could not connect to PvP server'))
    }

    socket.once('connect', handleConnect)
    socket.once('connect_error', handleError)
    socket.connect()
  })
}

export const emitPvpAck = (socket, eventName, payload, ackTimeoutMs = 8000) => {
  return new Promise((resolve, reject) => {
    socket.timeout(ackTimeoutMs).emit(eventName, payload, (error, response) => {
      if(error){
        reject(new Error(`Request timeout: ${eventName}`))
        return
      }

      resolve(response)
    })
  })
}

export const disconnectPvpSocket = () => {
  if(socketInstance){
    socketInstance.disconnect()
    socketInstance = null
  }
}
