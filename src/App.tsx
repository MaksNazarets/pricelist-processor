import React, { useRef, useState } from 'react';
import FileUploadingSection from './FileUploadingSection'
import './style.css'
import ColumnsHandlerSection from './ColumnsHandlerSection';
import FinalSection from './FinalSection';

export type file = {
  fileName?: string,
  selectedSheetName?: string,
  tableStartCell?: string,
  columns?: any,
  columnsRenamed?: { [key: string]: string },
  hasCategoryRows?: boolean,
  categoryColumnName?: string,
}

export const MainContext = React.createContext<any>({});

function App() {
  const [fileUploaded, setFileUploaded] = useState<file>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <>
      <MainContext.Provider value={{ fileUploaded, setFileUploaded, fileInputRef }}>
        <header>
          <span>pricelist processor</span>
        </header>
        <main id="container">
          <FileUploadingSection />
          {fileUploaded.columns && <ColumnsHandlerSection key={fileUploaded.columns} />}
          {fileUploaded.columnsRenamed && <FinalSection key={String(fileUploaded.columnsRenamed)} />}
        </main>
      </MainContext.Provider>
    </>
  )
}

export default App
