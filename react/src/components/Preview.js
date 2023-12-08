import { forwardRef, useEffect, useState, useRef, useLayoutEffect } from 'react'
import { ResponsiveSizing } from './ResponsiveSizing'

function getPointerPosition(event) {
  if (event.targetTouches) {
    if (event.targetTouches.length === 1) {
      return {
        x: event.targetTouches[0].clientX,
        y: event.targetTouches[0].clientY,
      }
    }
    return null
  }
  return { x: event.clientX, y: event.clientY }
}

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect
export const Preview = forwardRef(
  (
    {
      responsiveDesignMode,
      responsiveSize,
      onChangeResponsiveSize,
      frameUrl,
      mediaScreen
    },
    ref
  ) => {
    const containerRef = useRef()
    const [size, setSize] = useState({ width: 0, height: 0 })
    const [resizing, setResizing] = useState()
    const timeout = useRef()
    const constrainedResponsiveSize = constrainSize(
      responsiveSize.width,
      responsiveSize.height
    )

    function constrainWidth(desiredWidth) {
      const zoom = desiredWidth > size.width - 34 ? (size.width - 34) / desiredWidth : 1
      return {
        width: Math.min(
          Math.max(50, Math.round(desiredWidth * (1 / zoom))),
          Math.round((size.width - 34) * (1 / zoom))
        ),
        zoom,
      }
    }

    function constrainHeight(desiredHeight) {
      const zoom = desiredHeight > size.height - 17 - 24 ? (size.height - 17 - 24) / desiredHeight : 1
      return {
        height: Math.min(
          Math.max(50, Math.round(desiredHeight * (1 / zoom))),
          Math.round((size.height - 17 - 24) * (1 / zoom))
        ),
        zoom,
      }
    }

    function constrainSize(desiredWidth, desiredHeight) {
      const { width, zoom: widthZoom } = constrainWidth(desiredWidth)
      const { height, zoom: heightZoom } = constrainHeight(desiredHeight)
      return {
        width,
        height,
        zoom: Math.min(widthZoom, heightZoom),
      }
    }

    useEffect(() => {
      let isInitial = true
      const observer = new ResizeObserver(() => {
        window.clearTimeout(timeout.current)
        const rect = containerRef.current.getBoundingClientRect()
        const width = Math.round(rect.width)
        const height = Math.round(rect.height)
        setSize({
          visible: !isInitial && width !== 0 && height !== 0,
          width,
          height,
        })
        timeout.current = window.setTimeout(() => {
          setSize((size) => ({ ...size, visible: false }))
        }, 1000)
        isInitial = false
      })
      observer.observe(containerRef.current)
      return () => {
        observer.disconnect()
      }
    }, [])

    useIsomorphicLayoutEffect(() => {
      if (size.width > 50 && size.height > 50) {
        onChangeResponsiveSize(({ width, height }) => ({ width, height }))
      }

      if (resizing) {
        function onMouseMove(e) {
          e.preventDefault()
          const { x, y } = getPointerPosition(e)
          if (resizing.handle === 'bottom') {
            document.body.classList.add('cursor-ns-resize')
            onChangeResponsiveSize(({ width }) => ({
              width,
              height: resizing.startHeight + (y - resizing.startY),
            }))
          } else if (resizing.handle === 'left') {
            document.body.classList.add('cursor-ew-resize')
            onChangeResponsiveSize(({ height }) => ({
              width: resizing.startWidth - (x - resizing.startX) * 2,
              height,
            }))
          } else if (resizing.handle === 'right') {
            document.body.classList.add('cursor-ew-resize')
            onChangeResponsiveSize(({ height }) => ({
              width: resizing.startWidth + (x - resizing.startX) * 2,
              height,
            }))
          } else if (resizing.handle === 'bottom-left') {
            document.body.classList.add('cursor-nesw-resize')
            onChangeResponsiveSize(() => ({
              width: resizing.startWidth - (x - resizing.startX) * 2,
              height: resizing.startHeight + (y - resizing.startY),
            }))
          } else if (resizing.handle === 'bottom-right') {
            document.body.classList.add('cursor-nwse-resize')
            onChangeResponsiveSize(() => ({
              width: resizing.startWidth + (x - resizing.startX) * 2,
              height: resizing.startHeight + (y - resizing.startY),
            }))
          }
        }
        function onMouseUp(e) {
          e.preventDefault()
          if (resizing.handle === 'bottom') {
            document.body.classList.remove('cursor-ns-resize')
          } else if (resizing.handle === 'left') {
            document.body.classList.remove('cursor-ew-resize')
          } else if (resizing.handle === 'right') {
            document.body.classList.remove('cursor-ew-resize')
          } else if (resizing.handle === 'bottom-left') {
            document.body.classList.remove('cursor-nesw-resize')
          } else if (resizing.handle === 'bottom-right') {
            document.body.classList.remove('cursor-nwse-resize')
          }
          setResizing()
        }
        window.addEventListener('mousemove', onMouseMove)
        window.addEventListener('mouseup', onMouseUp)
        window.addEventListener('touchmove', onMouseMove)
        window.addEventListener('touchend', onMouseUp)
        return () => {
          window.removeEventListener('mousemove', onMouseMove)
          window.removeEventListener('mouseup', onMouseUp)
          window.removeEventListener('touchmove', onMouseMove)
          window.removeEventListener('touchend', onMouseUp)
        }
      }
    }, [resizing, size])

    function startLeft(e) {
      const pos = getPointerPosition(e)
      if (pos === null) return
      e.preventDefault()
      setResizing({
        handle: 'left',
        startWidth: constrainedResponsiveSize.width,
        startX: pos.x,
      })
    }

    function startRight(e) {
      const pos = getPointerPosition(e)
      if (pos === null) return
      e.preventDefault()
      setResizing({
        handle: 'right',
        startWidth: constrainedResponsiveSize.width,
        startX: pos.x,
      })
    }

    function startBottomLeft(e) {
      const pos = getPointerPosition(e)
      if (pos === null) return
      e.preventDefault()
      setResizing({
        handle: 'bottom-left',
        startWidth: constrainedResponsiveSize.width,
        startHeight: constrainedResponsiveSize.height,
        startX: pos.x,
        startY: pos.y,
      })
    }

    function startBottom(e) {
      const pos = getPointerPosition(e)
      if (pos === null) return
      e.preventDefault()
      setResizing({
        handle: 'bottom',
        startHeight: constrainedResponsiveSize.height,
        startY: pos.y,
      })
    }

    function startBottomRight(e) {
      const pos = getPointerPosition(e)
      if (pos === null) return
      e.preventDefault()
      setResizing({
        handle: 'bottom-right',
        startWidth: constrainedResponsiveSize.width,
        startHeight: constrainedResponsiveSize.height,
        startX: pos.x,
        startY: pos.y,
      })
    }

    return (
      <div
        className="absolute inset-0 top-0 flex flex-col bg-black"
        ref={containerRef}
      >
        {responsiveDesignMode && (
          <ResponsiveSizing
            mediaScreen={mediaScreen}
            responsiveSize={constrainedResponsiveSize}
            onChangeResponsiveSize={onChangeResponsiveSize}
          />
        )}
        <div
          className="flex-auto grid justify-center"
          style={
            responsiveDesignMode
              ? {
                gridTemplateColumns: '1.0625rem min-content 1.0625rem',
                gridTemplateRows: 'min-content 1.0625rem',
              }
              : { gridTemplateColumns: '100%' }
          }
        >
          {responsiveDesignMode && (
            <div
              className="cursor-ew-resize select-none bg-gray-800 text-gray-600 hover:text-gray-400 transition-colors duration-150 flex items-center justify-center"
              onMouseDown={startLeft}
              onTouchStart={startLeft}
            >
              <svg
                className="w-1.5 h-8"
                viewBox="0 0 6 32"
                fill="none"
                stroke="currentColor"
              >
                <path d="M 0.5 0 V 32 M 5.5 0 V 32" />
              </svg>
            </div>
          )}
          <div
            className={`relative${responsiveDesignMode ? ' border border-gray-700 shadow-sm overflow-hidden' : ''}`}
            style={
              responsiveDesignMode
                ? {
                  width: Math.round(
                    constrainedResponsiveSize.width *
                    constrainedResponsiveSize.zoom
                  ),
                  height: Math.round(
                    constrainedResponsiveSize.height *
                    constrainedResponsiveSize.zoom
                  ),
                }
                : {}
            }
          >
            <iframe
              ref={ref}
              title="Preview"
              id="frame"
              name="frame"
              src={frameUrl}
              style={
                responsiveDesignMode
                  ? {
                    width: constrainedResponsiveSize.width,
                    height: constrainedResponsiveSize.height,
                    marginLeft:
                      (constrainedResponsiveSize.width -
                        Math.round(
                          constrainedResponsiveSize.width *
                          constrainedResponsiveSize.zoom
                        )) /
                      -2,
                    transformOrigin: 'top',
                    transform: `scale(${constrainedResponsiveSize.zoom})`,
                  }
                  : {}
              }
              className={`absolute inset-0 w-full h-full bg-white ${resizing ? 'pointer-events-none select-none' : ''}`}
            />
          </div>
          {responsiveDesignMode && (
            <>
              <div
                className="cursor-ew-resize select-none bg-gray-800 text-gray-600 hover:text-gray-400 transition-colors duration-150 flex items-center justify-center"
                onMouseDown={startRight}
                onTouchStart={startRight}
              >
                <svg
                  className="w-1.5 h-8"
                  viewBox="0 0 6 32"
                  fill="none"
                  stroke="currentColor"
                >
                  <path d="M 0.5 0 V 32 M 5.5 0 V 32" />
                </svg>
              </div>
              <div
                className="cursor-nesw-resize select-none bg-gray-800 text-gray-600 hover:text-gray-400 transition-colors duration-150 flex items-center justify-center"
                onMouseDown={startBottomLeft}
                onTouchStart={startBottomLeft}
              >
                <svg
                  viewBox="0 0 16 6"
                  width={16}
                  height={6}
                  fill="none"
                  stroke="currentColor"
                  className="transform translate-x-0.5 -translate-y-0.5 rotate-45"
                >
                  <path d="M 0 0.5 H 16 M 0 5.5 H 16" />
                </svg>
              </div>
              <div
                className="cursor-ns-resize select-none bg-gray-800 text-gray-600 hover:text-gray-400 transition-colors duration-150 flex items-center justify-center"
                onMouseDown={startBottom}
                onTouchStart={startBottom}
              >
                <svg
                  className="w-8 h-1.5"
                  viewBox="0 0 32 6"
                  fill="none"
                  stroke="currentColor"
                >
                  <path d="M 0 0.5 H 32 M 0 5.5 H 32" />
                </svg>
              </div>
              <div
                className="cursor-nwse-resize select-none bg-gray-800 text-gray-600 hover:text-gray-400 transition-colors duration-150 flex items-center justify-center"
                onMouseDown={startBottomRight}
                onTouchStart={startBottomRight}
              >
                <svg
                  viewBox="0 0 16 6"
                  width={16}
                  height={6}
                  fill="none"
                  stroke="currentColor"
                  className="transform -translate-x-0.5 -translate-y-0.5 -rotate-45"
                >
                  <path d="M 0 0.5 H 16 M 0 5.5 H 16" />
                </svg>
              </div>
            </>
          )}
        </div>
        {
          !responsiveDesignMode && size.visible && (
            <div className="absolute top-0.5 mx-auto w-full flex justify-center z-[101]">
              <span className="flex content-center rounded-full text-xs whitespace-pre px-2 py-0 tabular-nums border border-gray-400/50 shadow bg-gray-600/80 select-none">
                {size.width}
                {'  '}×{'  '}
                {size.height}
              </span>
            </div>
          )
        }
      </div >
    )
  }
)
