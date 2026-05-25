import { useState, useMemo } from 'react';
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

  const masterData = useMemo(() => parseMasterData(masterRaw), [masterRaw]);

  const masterReady = masterData.size > 0;
  const canGenerate = masterReady && emailText.trim().length > 0;

  async function handleExcelUpload(file: File) {
    const { masterData: xlData, customSynonyms: xlSyns } = await parseExcelFile(file);
    // Replace embedded newlines in multi-line Excel cells (Alt+Enter) with " | "
    // so the tab-separated round-trip through parseMasterData doesn't lose the second line
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

      <main className="panes">
        <LeftPane
          value={masterRaw}
          onChange={setMasterRaw}
          masterData={masterData}
          onExcelUpload={handleExcelUpload}
          excelFileName={excelFileName}
          onClearExcel={handleClearExcel}
        />
        <MiddlePane
          value={emailText}
          onChange={setEmailText}
          onGenerate={handleGenerate}
          canGenerate={canGenerate}
          masterReady={masterReady}
        />
        <RightPane results={results} />
      </main>
    </div>
  );
}
