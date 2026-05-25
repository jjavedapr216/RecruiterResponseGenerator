import { useState, useMemo, useRef } from 'react';
import { parseMasterData, parseExcelFile, extractRequestedFields } from './lib/parser';
import { matchFields, type MatchedField } from './lib/matcher';
import LeftPane from './components/LeftPane';
import MiddlePane from './components/MiddlePane';
import RightPane from './components/RightPane';
import './App.css';

export default function App() {
  const [masterRaw, setMasterRaw] = useState('');
  const [emailText, setEmailText] = useState('');
  const [results, setResults] = useState<MatchedField[]>([]);
  const [customSynonyms, setCustomSynonyms] = useState<Map<string, string>>(new Map());
  const [excelFileName, setExcelFileName] = useState('');

  // Resizable pane widths (percentages; right pane takes the remainder via flex:1)
  const [leftWidth, setLeftWidth] = useState(33.33);
  const [midWidth, setMidWidth] = useState(33.33);
  const panesRef = useRef<HTMLElement>(null);
  const resizing = useRef<{
    which: 'left' | 'right';
    startX: number;
    startLeft: number;
    startMid: number;
  } | null>(null);

  const masterData = useMemo(() => parseMasterData(masterRaw), [masterRaw]);

  const masterReady = masterData.size > 0;
  const canGenerate = masterReady && emailText.trim().length > 0;

  async function handleExcelUpload(file: File) {
    const { masterData: xlData, customSynonyms: xlSyns } = await parseExcelFile(file);
    const text = [...xlData.entries()]
      .map(([k, v]) => `${k}\t${v.replace(/\r?\n/g, ' | ')}`)
      .join('\n');
    setMasterRaw(text);
    setCustomSynonyms(xlSyns);
    setExcelFileName(file.name);
  }

  function handleClearExcel() {
    setMasterRaw('');
    setCustomSynonyms(new Map());
    setExcelFileName('');
    setResults([]);
  }

  function handleClearAll() {
    setMasterRaw('');
    setCustomSynonyms(new Map());
    setExcelFileName('');
    setEmailText('');
    setResults([]);
  }

  const handleGenerate = () => {
    const fields = extractRequestedFields(emailText);
    const matched = matchFields(fields, masterData, customSynonyms.size > 0 ? customSynonyms : undefined);
    setResults(matched);
  };

  function startResize(e: React.MouseEvent, which: 'left' | 'right') {
    e.preventDefault();
    resizing.current = { which, startX: e.clientX, startLeft: leftWidth, startMid: midWidth };

    function onMove(ev: MouseEvent) {
      if (!resizing.current || !panesRef.current) return;
      const { which, startX, startLeft, startMid } = resizing.current;
      const containerW = panesRef.current.clientWidth;
      const pct = ((ev.clientX - startX) / containerW) * 100;
      if (which === 'left') {
        setLeftWidth(Math.max(15, Math.min(60, startLeft + pct)));
      } else {
        setMidWidth(Math.max(15, Math.min(60, startMid + pct)));
      }
    }

    function onUp() {
      resizing.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    }

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-brand">
          <span className="app-logo">⚡</span>
          <div>
            <h1 className="app-title">Recruiter Response Generator</h1>
            <p className="app-sub">Smart field matching for job seekers</p>
          </div>
        </div>
        <div className="app-header-right">
          <div className="app-security">
            <span>🔒</span>
            <span>100% local · no cloud · no storage</span>
          </div>
          <button className="btn btn-sm btn-clear-all" onClick={handleClearAll} title="Wipe all data from memory">
            🗑 Clear All Data
          </button>
        </div>
      </header>

      <main className="panes" ref={panesRef}>
        <div className="pane-wrapper" style={{ width: `${leftWidth}%` }}>
          <LeftPane
            value={masterRaw}
            onChange={setMasterRaw}
            masterData={masterData}
            onExcelUpload={handleExcelUpload}
            excelFileName={excelFileName}
            onClearExcel={handleClearExcel}
          />
        </div>
        <div className="pane-resize-handle" onMouseDown={e => startResize(e, 'left')} title="Drag to resize" />
        <div className="pane-wrapper" style={{ width: `${midWidth}%` }}>
          <MiddlePane
            value={emailText}
            onChange={setEmailText}
            onGenerate={handleGenerate}
            canGenerate={canGenerate}
            masterReady={masterReady}
          />
        </div>
        <div className="pane-resize-handle" onMouseDown={e => startResize(e, 'right')} title="Drag to resize" />
        <div className="pane-wrapper pane-wrapper-right">
          <RightPane results={results} />
        </div>
      </main>
    </div>
  );
}
