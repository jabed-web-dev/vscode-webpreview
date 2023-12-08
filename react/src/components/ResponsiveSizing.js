import { useState } from "react";

export function ResponsiveSizing({
    responsiveSize,
    mediaScreen,
    onChangeResponsiveSize
}) {
    const [zoom, setZoom] = useState(1);
    const [zoomStartWidth, setZoomStartWidth] = useState();
    const [rotate, setRotate] = useState('portrait');

    function startZoom() {
        setZoomStartWidth(responsiveSize.width)
    }

    function startZooming(e) {
        e.preventDefault()
        const zoom = e.target.value
        setZoom(zoom)
        onChangeResponsiveSize(({ height }) => {
            let width = zoomStartWidth * zoom;
            width > height ? setRotate('landscape') : setRotate('portrait')
            return { width, height }
        })
    }

    function startRotate(e) {
        e.preventDefault()
        rotate === 'portrait' ? setRotate('landscape') : setRotate('portrait')
        onChangeResponsiveSize(({ width, height }) => ({
            width: height,
            height: width
        }))
    }

    function startDeviseSelect(e) {
        e.preventDefault()
        let [width, height] = e.target.value.split('x')
        width = parseInt(width)
        height = height ? parseInt(height) : width > (window.innerWidth - 34) ? parseInt(parseInt(width / ((window.innerWidth - 34) / 100)) * ((window.innerHeight - 41) / 100)) : (window.innerHeight - 41)
        width > height ? setRotate('landscape') : setRotate('portrait')
        onChangeResponsiveSize(() => ({
            width,
            height
        }))
    }

    return (
        <div className="flex flex-none text-xs py-1 bg-gray-900">
            <div className="flex ml-2 flex-grow-0 space-x-2">
                <select
                    onChange={startDeviseSelect}
                    className="!outline-none focus:!outline-none rounded px-1 bg-gray-700 text-gray-300 focus:ring-2 focus:ring-gray-500 cursor-pointer">
                    <option value={`380x${window.innerHeight - 41}`}>Media Screen</option>
                    {(() => {
                        let options = [], i = 1;
                        for (const screen in mediaScreen) {
                            options.push(<option key={i++} value={mediaScreen[screen]}>{screen}</option>)
                        }
                        return options;
                    })()}
                </select>
                <svg onClick={startRotate}
                    className={`${rotate === 'landscape' ? 'rotate-90 ' : ''}w-4 h-[18px] fill-gray-500/60 stroke-gray-400/80 hover:fill-gray-500/80 hover:stroke-gray-300/80 cursor-pointer transition-transform select-none`}
                    strokeWidth={2}
                    viewBox="-1 -1 18 18"
                    strokeLinecap="round"
                    strokeLinejoin="round">
                    <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2z" />
                </svg>
            </div>
            <div className="flex justify-center flex-grow space-x-6">
                <span>
                    <input
                        onMouseDown={startZoom}
                        onChange={startZooming}
                        type="range" min={0.2} max={1.8} step={0.02} value={zoom}
                        className="appearance-none h-2 w-28 rounded !outline-none focus:!outline-none opacity-80 transition-opacity hover:opacity-100 bg-gray-600 slider-thumb"
                    />
                </span>
                <span className="text-gray-400 whitespace-pre tabular-nums">
                    {responsiveSize.width}
                    {' '}×{' '}
                    {responsiveSize.height}
                    {'  '}
                    <span className="text-gray-400/80">
                        ({Math.round(responsiveSize.zoom * 100)}%)
                    </span>
                </span>
            </div>
        </div >
    )
}