import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import useContentStore from '@/store/contentStore'
import useUIStore from '@/store/uiStore'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'

let socket = null

export const useSocket = () => {
  const initialized = useRef(false)
  const { addBreakingItem } = useContentStore()
  const { addNotif } = useUIStore()

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    socket = io(SOCKET_URL, { transports: ['websocket'], reconnectionDelay: 2000 })

    socket.on('connect', () => console.log('[Socket] Connected'))
    socket.on('disconnect', () => console.log('[Socket] Disconnected'))

    // Breaking news pushed from admin/editor
    socket.on('breaking:news', (item) => {
      addBreakingItem(item)
      addNotif({ type: 'breaking', title: item.title, time: new Date() })
    })

    // Live stream went live
    socket.on('live:started', (data) => {
      addNotif({ type: 'live', title: `${data.title} is now live!`, time: new Date() })
    })

    return () => {
      socket?.disconnect()
      initialized.current = false
    }
  }, [])

  return socket
}

export default useSocket
