import { useState, useRef } from 'react'
import { Preview } from './components/Preview'

function App() {
  const previewRef = useRef()
    , [responsiveDesignMode, setResponsiveDesignMode] = useState(false)
    , DEFAULT_RESPONSIVE_SIZE = { width: 380, height: (window.innerHeight - 41) }
    , [responsiveSize, setResponsiveSize] = useState(DEFAULT_RESPONSIVE_SIZE)
    , [url, setUrl] = useState('http://localhost:3000')
    , [mediaScreens, setMediaScreens] = useState({})
    , media = window.matchMedia('(min-width: 500px)').matches
    
  // Handle the message inside the webview
  window.addEventListener('message', (event) => {
    const { preview } = event.data;
    if (preview) {
      if (preview.url) {
        setUrl(preview.url)
      }
      if (preview.mediaScreen) {
        setMediaScreens(preview.mediaScreen)
      }
      if (preview.responsive) {
        setResponsiveDesignMode(media && !responsiveDesignMode)
      }
      if (preview.refresh) {
        try {
          setUrl(new URL(url))
        } catch {
          setUrl(url)
        }
      }
    }
  });

  return (
    <main className="w-full h-full">
      <Preview
        ref={previewRef}
        frameUrl={url}
        mediaScreen={mediaScreens}
        responsiveDesignMode={media && responsiveDesignMode}
        responsiveSize={responsiveSize}
        onChangeResponsiveSize={setResponsiveSize}
      />
    </main>
  )
}

export default App;
