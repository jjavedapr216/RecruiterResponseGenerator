interface Props {
  value: string;
  onChange: (v: string) => void;
  onGenerate: () => void;
  canGenerate: boolean;
  masterReady: boolean;
}

const PLACEHOLDER = `Paste recruiter email or form here.

Example 1 — form style (CSV):
Full Legal Name,
Last 4 digits of SSN,
Visa Status,
Current Location,
LinkedIn URL,
Availability,

Example 2 — plain text:
Please provide:
• Full Name
• Work Authorization
• Last 4 SSN
• Current Location (City/State)
• Availability to Join`;

export default function MiddlePane({ value, onChange, onGenerate, canGenerate, masterReady }: Props) {
  const hasEmail = value.trim().length > 0;
  const lineCount = hasEmail ? value.split('\n').length : 0;

  let hint: { text: string; type: 'info' | 'warn' } | null = null;
  if (!masterReady) {
    hint = { text: '← Paste your master data in the left pane first', type: 'warn' };
  } else if (!hasEmail) {
    hint = { text: '↑ Paste the recruiter email above, then click Generate', type: 'info' };
  }

  return (
    <div className={`pane ${masterReady && !hasEmail ? 'pane-awaiting' : ''}`}>
      <div className="pane-header">
        <div className="pane-title">
          <span className="pane-icon">📧</span>
          Recruiter Email / Form
        </div>
        <div className="pane-header-right">
          {lineCount > 0 && (
            <span className="badge badge-neutral">{lineCount} lines</span>
          )}
          {hasEmail && (
            <button className="btn btn-sm btn-outline" onClick={() => onChange('')}>
              ✕ Clear
            </button>
          )}
        </div>
      </div>

      <div className="pane-hint">
        Paste the recruiter email or form asking for your details.
      </div>

      <div className="pane-body">
        <textarea
          className={`pane-textarea ${masterReady && !hasEmail ? 'textarea-waiting' : ''}`}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={PLACEHOLDER}
          spellCheck={false}
          autoFocus={masterReady}
        />
      </div>

      <div className="pane-footer pane-footer-center">
        {hint && (
          <p className={`generate-hint generate-hint-${hint.type}`}>{hint.text}</p>
        )}
        <button
          className="btn btn-generate"
          onClick={onGenerate}
          disabled={!canGenerate}
        >
          ⚡ Generate Response
        </button>
      </div>
    </div>
  );
}
