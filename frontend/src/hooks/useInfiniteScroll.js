import { useEffect, useRef, useCallback } from 'react'

const useInfiniteScroll = (callback, hasMore, isLoading) => {
  const observerRef = useRef(null)

  const lastElementRef = useCallback(node => {
    if (isLoading) return
    if (observerRef.current) observerRef.current.disconnect()

    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) callback()
    }, { threshold: 0.1 })

    if (node) observerRef.current.observe(node)
  }, [isLoading, hasMore, callback])

  useEffect(() => {
    return () => { if (observerRef.current) observerRef.current.disconnect() }
  }, [])

  return lastElementRef
}

export default useInfiniteScroll
