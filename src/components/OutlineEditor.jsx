import { useLayoutEffect, useRef } from 'react';

function fitFieldHeight(element) {
  const style = getComputedStyle(element);
  const borders = (Number.parseFloat(style.borderTopWidth) || 0)
    + (Number.parseFloat(style.borderBottomWidth) || 0);
  element.style.height = 'auto';
  // scrollHeight includes padding, but not the border-box's two borders.
  const height = Math.max(33, Math.min(Math.ceil(element.scrollHeight + borders), 220));
  element.style.height = `${height}px`;
}

function PlainTextField({ id, label, value, onChange }) {
  const field = useRef(null);
  useLayoutEffect(() => {
    const element = field.current;
    if (!element) return;
    fitFieldHeight(element);
  }, [value]);

  useLayoutEffect(() => {
    const element = field.current;
    if (!element) return;
    let active = true;
    let frame = 0;
    let lastWidth = element.getBoundingClientRect().width;
    const scheduleResize = () => {
      if (!active) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (active) fitFieldHeight(element);
      });
    };
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(() => {
      const width = element.getBoundingClientRect().width;
      // Our height write also triggers observation: react only to width changes.
      if (width === lastWidth) return;
      lastWidth = width;
      scheduleResize();
    }) : null;
    observer?.observe(element);
    if (!observer) window.addEventListener('resize', scheduleResize);

    const fonts = document.fonts;
    fonts?.ready.then(scheduleResize, () => {});
    fonts?.addEventListener('loadingdone', scheduleResize);
    return () => {
      active = false;
      observer?.disconnect();
      cancelAnimationFrame(frame);
      if (!observer) window.removeEventListener('resize', scheduleResize);
      fonts?.removeEventListener('loadingdone', scheduleResize);
    };
  }, []);

  return <div className="outline-field">
    <label htmlFor={id}>{label}</label>
    <textarea ref={field} id={id} value={value} rows={1} maxLength={2000} onChange={(event) => onChange(event.target.value)} spellCheck="false" autoComplete="off" />
  </div>;
}

export default function OutlineEditor({ outline, onEdit, onDownload, downloadNote }) {
  if (!outline) return null;
  return <section className="outline-region" aria-labelledby="outline-heading">
    <h2 id="outline-heading">Work outline</h2>
    <h3>{outline.title}</h3>
    <PlainTextField id="outline-included" label="Included" value={outline.included} onChange={(value) => onEdit('included', value)} />
    <PlainTextField id="outline-confirm" label="Confirm first" value={outline.confirmFirst} onChange={(value) => onEdit('confirmFirst', value)} />
    <div className="download-actions"><button className="button primary" type="button" onClick={onDownload}>Download outline</button></div>
    <p className="download-status visually-hidden" role="status" aria-live="polite">{downloadNote}</p>
    <p className="review-note">Review the scope with your client before using it.</p>
  </section>;
}
