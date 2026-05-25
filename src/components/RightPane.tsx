import { useState, useEffect } from 'react';
import type { MatchedField } from '../lib/matcher';

interface Props {
  results: MatchedField[];
}

type CopiedKey = 'email' | 'table' | null;

export default function RightPane({ results }: Props) {
  const [maskSensitive, setMaskSensitive] = useState(false);
  const [copied, setCopied] = useState<CopiedKey>(null);
  const [overrides, setOverrides] = useState<Map<number, string>>(new Map());

  // Reset overrides whenever a new result set arrives
  useEffect(() => { setOverrides(new Map()); }, [results]);

  const getVal = (r: MatchedField, i: number): string =>
    overrides.has(i) ? overrides.get(i)! : (r.value ?? '');

  const display = (r: MatchedField, i: number): string => {
    const val = getVal(r, i);
    return maskSensitive && r.sensitive && val ? '••••' : val;
  };

  const setOverride = (i: number, val: string) =>
    setOverrides(m => { const nm = new Map(m); nm.set(i, val); return nm; });

  const flash = (key: CopiedKey) => {
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const copyAsEmail = () => {
    const lines = results
      .filter((r, i) => getVal(r, i))
      .map((r, i) => `${r.canonicalLabel}: ${display(r, i)}`);
    const body = 'Please find the requested details below:\n\n' + lines.join('\n');
    navigator.clipboard.writeText(body);
    flash('email');
  };

  const copyAsHtmlTable = async () => {
    const cell = 'border:1px solid #cccccc;padding:8px 14px;text-align:left;vertical-align:top;color:#000000;font-size:13px;font-family:Arial,sans-serif;';
    const thStyle = cell + 'background:#f0f0f0;font-weight:700;';
    const tdFieldStyle = cell + 'background:#fafafa;font-weight:600;white-space:nowrap;';
    const tdValStyle = cell;

    // Fix 1: use requestedLabel (recruiter's label)
    // Fix 2: include ALL rows; empty string for not-found so user can fill manually
    const rows = results
      .map((r, i) => {
        const val = display(r, i);
        return `<tr><td style="${tdFieldStyle}">${escHtml(r.requestedLabel)}</td><td style="${tdValStyle}">${escHtml(val)}</td></tr>`;
      })
      .join('');

    const html = `<table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:13px;"><thead><tr><th style="${thStyle}">Field</th><th style="${thStyle}">Value</th></tr></thead><tbody>${rows}</tbody></table>`;

    try {
      const blob = new Blob([html], { type: 'text/html' });
      await navigator.clipboard.write([new ClipboardItem({ 'text/html': blob })]);
    } catch {
      const header = 'Field\tValue';
      const plainRows = results
        .map((r, i) => `${r.requestedLabel}\t${display(r, i)}`)
        .join('\n');
      navigator.clipboard.writeText([header, plainRows].join('\n'));
    }
    flash('table');
  };

  const downloadCSV = () => {
    const escape = (s: string) => `"${s.replace(/"/g, '""')}"`;
    const header = 'Requested Field,Matched As,Value';
    const rows = results.map((r, i) =>
      [
        escape(r.requestedLabel),
        escape(r.canonicalLabel),
        escape(getVal(r, i)),
      ].join(','),
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'recruiter-response.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const matched = results.filter(r => r.matched).length;
  const total = results.length;

  if (total === 0) {
    return (
      <div className="pane">
        <div className="pane-header">
          <div className="pane-title">
            <span className="pane-icon">✨</span>
            Generated Response
          </div>
        </div>
        <div className="pane-empty">
          <div className="empty-icon">🎯</div>
          <p className="empty-title">Ready to generate</p>
          <p className="empty-sub">
            Paste your master data and the recruiter email,<br />
            then click <strong>Generate Response</strong>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="pane">
      <div className="pane-header">
        <div className="pane-title">
          <span className="pane-icon">✨</span>
          Generated Response
        </div>
        <div className="pane-header-right">
          <span className={`badge ${matched === total ? 'badge-success' : 'badge-warn'}`}>
            {matched}/{total} matched
          </span>
          <label className="toggle-mask">
            <input
              type="checkbox"
              checked={maskSensitive}
              onChange={e => setMaskSensitive(e.target.checked)}
            />
            Mask sensitive
          </label>
        </div>
      </div>

      <div className="pane-body pane-body-scroll">
        <table className="results-table">
          <thead>
            <tr>
              <th>Requested Field</th>
              <th>Matched As</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r, i) => (
              <tr key={i} className={r.matched ? '' : 'row-unmatched'}>
                <td className="td-req">{r.requestedLabel}</td>
                <td className="td-canon">
                  <div className="td-canon-inner">
                    {r.canonicalLabel}
                    {r.sensitive && (
                      <span className="lock-icon" title="Sensitive field">🔒</span>
                    )}
                  </div>
                </td>
                <td className="td-val">
                  <input
                    className="td-val-input"
                    value={display(r, i)}
                    readOnly={maskSensitive && r.sensitive && !!getVal(r, i)}
                    onChange={e => setOverride(i, e.target.value)}
                    placeholder={!r.value ? 'not found — click to fill' : ''}
                    title={!r.value ? 'Not matched — type your value here' : 'Click to edit'}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pane-footer pane-footer-actions">
        <button className="btn btn-sm btn-outline" onClick={copyAsEmail}>
          {copied === 'email' ? '✓ Copied!' : '📋 Copy as Email'}
        </button>
        <button className="btn btn-sm btn-outline" onClick={copyAsHtmlTable}>
          {copied === 'table' ? '✓ Copied!' : '📊 Copy Table'}
        </button>
        <button className="btn btn-sm btn-outline" onClick={downloadCSV}>
          ⬇ Download CSV
        </button>
      </div>
    </div>
  );
}

function escHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
