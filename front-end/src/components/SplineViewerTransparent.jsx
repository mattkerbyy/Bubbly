import { useEffect, useRef } from 'react'

export default function SplineViewerTransparent({ url, className = '', style = {} }) {
  const viewerRef = useRef(null)

  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer) return

    const makeTransparent = () => {
      try {
        // Force transparent background on the viewer element
        viewer.style.background = 'transparent'
        viewer.style.backgroundColor = 'transparent'

        // Method 1: Direct canvas access
        const canvas = viewer.querySelector('canvas')
        if (canvas) {
          canvas.style.background = 'transparent'
          canvas.style.backgroundColor = 'transparent'
          
          // Try to clear WebGL background
          const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
          if (gl) {
            gl.clearColor(0, 0, 0, 0) // RGBA with alpha = 0 (fully transparent)
          }
        }

        // Method 2: Shadow DOM access (if available)
        if (viewer.shadowRoot) {
          const shadowCanvas = viewer.shadowRoot.querySelector('canvas')
          if (shadowCanvas) {
            shadowCanvas.style.background = 'transparent'
            shadowCanvas.style.backgroundColor = 'transparent'
          }

          // Also target any divs or containers in shadow DOM
          const shadowElements = viewer.shadowRoot.querySelectorAll('div, canvas, *')
          shadowElements.forEach(el => {
            el.style.background = 'transparent'
            el.style.backgroundColor = 'transparent'
          })
        }

        // Method 3: Target all nested canvases
        const allCanvases = viewer.querySelectorAll('canvas')
        allCanvases.forEach(c => {
          c.style.background = 'transparent'
          c.style.backgroundColor = 'transparent'
          
          const gl = c.getContext('webgl2') || c.getContext('webgl')
          if (gl) {
            gl.clearColor(0, 0, 0, 0)
          }
        })
      } catch (error) {
        console.warn('Spline transparency adjustment:', error)
      }
    }

    // Try multiple times to catch the canvas at different load stages
    const timeouts = [
      setTimeout(makeTransparent, 100),
      setTimeout(makeTransparent, 500),
      setTimeout(makeTransparent, 1000),
      setTimeout(makeTransparent, 2000),
      setTimeout(makeTransparent, 3000),
    ]

    // Listen for load event
    const handleLoad = () => {
      makeTransparent()
      // Keep trying even after load
      setTimeout(makeTransparent, 100)
      setTimeout(makeTransparent, 500)
    }
    
    viewer.addEventListener('load', handleLoad)
    viewer.addEventListener('ready', handleLoad)

    // Also use MutationObserver to catch DOM changes
    const observer = new MutationObserver(() => {
      makeTransparent()
    })

    observer.observe(viewer, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style']
    })

    return () => {
      timeouts.forEach(clearTimeout)
      viewer.removeEventListener('load', handleLoad)
      viewer.removeEventListener('ready', handleLoad)
      observer.disconnect()
    }
  }, [url])

  return (
    <spline-viewer 
      ref={viewerRef}
      url={url}
      className={className}
      style={{
        background: 'transparent',
        backgroundColor: 'transparent',
        pointerEvents: 'none',
        ...style
      }}
    ></spline-viewer>
  )
}
