export default function RequestForm({ request, onChange, onSample, onFind, busy, error }) {
  return <section className="request-region" aria-labelledby="request-heading">
    <h2 id="request-heading">Client request</h2>
    <form onSubmit={(event) => { event.preventDefault(); onFind(); }}>
      <label className="visually-hidden" htmlFor="client-request">Client request, up to 800 characters</label>
      <textarea id="client-request" className="request-input" value={request} onChange={(event) => onChange(event.target.value)} maxLength={800} spellCheck="false" autoComplete="off" aria-describedby="request-privacy" />
      <div className="request-actions">
        <button type="button" className="button secondary" onClick={onSample}>Use sample</button>
        <button type="submit" className="button primary" disabled={busy || !request.trim()} aria-busy={busy}>Find services</button>
      </div>
      <p id="request-privacy" className="privacy-note">Text stays on this device. The model downloads on first use.</p>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
    </form>
  </section>;
}
