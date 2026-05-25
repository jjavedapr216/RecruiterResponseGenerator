import { useRef } from 'react';
import type { MasterData } from '../lib/parser';

interface Props {
  value: string;
  onChange: (v: string) => void;
  masterData: MasterData;
  onExcelUpload: (file: File) => void;
  excelFileName: string;
  onClearExcel: () => void;
}

const PLACEHOLDER = `Paste your master data here (CSV or tab-separated from Excel).

Example (tab-separated):
Full Name\tJohn Doe
First Name\tJohn
Last Name\tDoe
Phone Number\t+1 555 123 4567
Email\tjohn@email.com
Visa Status\tH1B
Last 4 SSN\t4255
Passport Number\tX1234567
Current Location\tIrving, TX
LinkedIn URL\thttps://linkedin.com/in/johndoe
Availability\tImmediate`;

export default function LeftPane({ value, onChange, masterData, onExcelUpload, excelFileName, onClearExcel }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const entries = [...masterData.entries()].filter(([, v]) => v);
  const count = entries.length;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onExcelUpload(file);
    e.target.value = '';
  }

  return (
    <div className="pane">
      <div className="pane-header">
        <div className="pane-title">
          <span className="pane-icon">📋</span>
          Master Data
        </div>
        <div className="pane-header-right">
          {count > 0 && (
            <span className="badge badge-success">{count} fields</span>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <button
            className="btn btn-sm btn-outline"
            onClick={() => fileInputRef.current?.click()}
            title="Upload Excel file with Field Name / Value / Synonyms columns"
          >
            📎 Upload Excel
          </button>
        </div>
      </div>

      {excelFileName ? (
        <div className="pane-hint">
          <span className="excel-pill">
            📊 {excelFileName}
            <span
              className="excel-pill-clear"
              onClick={onClearExcel}
              title="Clear uploaded file"
            >×</span>
          </span>
        </div>
      ) : (
        <div className="pane-hint">
          Paste your Excel / CSV master sheet. Data is session-only — never stored.
        </div>
      )}

      <div className="pane-body">
        <textarea
          className="pane-textarea"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={PLACEHOLDER}
          spellCheck={false}
        />
      </div>

      {count > 0 && (
        <div className="pane-footer parsed-preview">
          {entries.slice(0, 6).map(([k, v]) => (
            <div key={k} className="parsed-item">
              <span className="parsed-key">{k}</span>
              <span className="parsed-sep">→</span>
              <span className="parsed-val">{v.length > 28 ? v.slice(0, 28) + '…' : v}</span>
            </div>
          ))}
          {count > 6 && (
            <div className="parsed-more">+{count - 6} more fields parsed</div>
          )}
        </div>
      )}
    </div>
  );
}
