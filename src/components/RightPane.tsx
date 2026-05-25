import { useState } from 'react';
import type { MatchedField } from '../lib/matcher';

interface Props {
  results: MatchedField[];
}

type CopiedKey = 'email' | 'table' | null;

export default function RightPane({ results }: Props) {
  const [maskSensitive, setMaskSensitive] = useState(false);
  const [copied, setCopied] = useState<CopiedKey>(null);

  const display = (r: MatchedField) =>
    maskSensitive && r.sensitive && r.value ? '••••' : r.value;

  const flash = (key: CopiedKey) => {
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const copyAsEmail = () => {
    const lines = results
      .filter(r => r.value)
      .map(r => `${r.canonicalLabel}: ${display(r)}`);
    const body =
      'Please find the requested details below:\n\n' + lines.join('\n');
    navigator.clipboard.writeText(body);
    flash('email');
  };

  const copyAsHtmlTable = async () => {
    const cell = 'border:1px solid #cccccc;padding:8px 14px;text-align:left;vertical-align:top;color:#000000;font-size:13px;font-family:Arial,sans-serif;';
    const thStyle = cell + 'background:#f0f0f0;font-weight:700;';
    const tdFieldStyle = cell + 'background:#fafafa;font-weight:600;white-space:nowrap;';
    const tdValStyle = cell;

    const rows = results
      .filter(r => r.value)
      .map(r => {
        const val = display(r) || '';
        return `<tr><td style="${tdFieldStyle}">${escHtml(r.canonicalLabel)}</td><td style="${tdValStyle}">${escHtml(val)}</td></tr>`;
      })
      .join('');

    const html = `<table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:13px;"><thead><tr><th style="${thStyle}">Field</th><th style="${thStyle}">Value</th></tr></thead><tbody>${rows}</tbody></table>`;

    try {
      const blob = new Blob([html], { type: 'text/html' });
      await navigator.clipboard.write([new ClipboardItem({ 'text/html': blob })]);
    } catch {
      // Fallback: copy as tab-separated plain text
      const header = 'Field\tValue';
      const plainRows = results
        .filter(r => r.value)
        .map(r => `${r.canonicalLabel}\t${display(r) || ''}`)
        .join('\n');
      navigator.clipboard.writeText([header, plainRows].join('\n'));
    }
    flash('table');
  };

  const downloadCSV = () => {
    const escape = (s: string) => `"${s.replace(/"/g, '""')}"`;
    const header = 'Requested Field,Matched As,Value';
    const rows = results.map(r =>
      [
        escape(r.requestedLabel),
        escape(r.canonicalLabel),
        escape(display(r) || ''),
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
                <td className={`td-val ${!r.value ? 'td-empty' : ''}`}>
                  {display(r) || <em>not found</em>}
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
