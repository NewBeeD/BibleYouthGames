import { useEffect, useState } from 'react'
import { Chip, Tooltip } from '@mui/material'
import FiberManualRecordRoundedIcon from '@mui/icons-material/FiberManualRecordRounded'
import { getPvpServerUrl, getPvpSocket } from '../modules/pvpSocket'

export const PvpConnectionBadge = ({ size = 'small' }) => {
  const socket = getPvpSocket()
  const [status, setStatus] = useState(socket.connected ? 'connected' : 'connecting')
  const [lastError, setLastError] = useState('')

  useEffect(() => {
    const handleConnected = () => setStatus('connected')
    const handleConnecting = () => setStatus('connecting')
    const handleDisconnected = () => setStatus('disconnected')
    const handleConnectError = (error) => {
      setStatus('disconnected')
      setLastError(error?.message || 'Connection failed')
    }

    if(!socket.connected){
      setStatus('connecting')
      socket.connect()
    }

    socket.on('connect', handleConnected)
    socket.on('reconnect_attempt', handleConnecting)
    socket.on('disconnect', handleDisconnected)
    socket.on('connect_error', handleConnectError)

    const fallbackId = setTimeout(() => {
      if(!socket.connected){
        setStatus('disconnected')
      }
    }, 3000)

    return () => {
      clearTimeout(fallbackId)
      socket.off('connect', handleConnected)
      socket.off('reconnect_attempt', handleConnecting)
      socket.off('disconnect', handleDisconnected)
      socket.off('connect_error', handleConnectError)
    }
  }, [socket])

  const connected = status === 'connected'
  const connecting = status === 'connecting'

  const label = connected ? 'Connected' : connecting ? 'Connecting...' : 'Disconnected'
  const iconColor = connected ? '#bbf7d0 !important' : connecting ? '#fde68a !important' : '#f3f4f6 !important'
  const chipColor = connected ? 'success' : connecting ? 'warning' : 'default'

  return (
    <Tooltip title={`PvP server: ${getPvpServerUrl()}${lastError ? ` | ${lastError}` : ''}`}>
      <Chip
        size={size}
        icon={<FiberManualRecordRoundedIcon sx={{ fontSize: 12, color: iconColor }} />}
        label={label}
        color={chipColor}
        variant={connected ? 'filled' : 'outlined'}
        sx={{
          color: connected ? 'white' : '#f3f4f6',
          borderColor: connected ? 'transparent' : 'rgba(243,244,246,0.6)',
          backgroundColor: connected ? undefined : connecting ? 'rgba(251, 191, 36, 0.18)' : 'rgba(255,255,255,0.08)'
        }}
      />
    </Tooltip>
  )
}
