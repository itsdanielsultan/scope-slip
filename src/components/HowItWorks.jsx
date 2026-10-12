import { useEffect, useRef } from 'react';

export default function HowItWorks({ open, onClose }) {
  const dialog = useRef(null);
  useEffect(() => {
    const element = dialog.current;
    if (open && !element.open) element.showModal();
    else if (!open && element.open) element.close();
  }, [open]);
  return <dialog ref={dialog} className="how-dialog" onCancel={onClose} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }} aria-labelledby="how-heading">
    <div className="how-content">
      <h2 id="how-heading">How it works</h2>
      <p>Describe a request. An open model compares its meaning with seven fictional sample services on your device. The three closest services appear; their order is a suggestion, not a measure of certainty.</p>
      <p>Choose one service, edit what is included and what to confirm, then download a Markdown outline. The outline is a starting point for a conversation.</p>
      <p>Your request and edits stay in memory in this tab. They are not sent to a model service, logged or saved. The model and its runtime download from their public hosts; your browser may download them again if its cache is cleared.</p>
      <p>An open MiniLM model runs on this device. No account or payment is needed.</p>
      <button className="button primary" type="button" onClick={onClose}>Close</button>
    </div>
  </dialog>;
}
