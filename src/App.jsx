import { useState } from 'react';
import RequestForm from './components/RequestForm.jsx';
import MatchingServices from './components/MatchingServices.jsx';
import OutlineEditor from './components/OutlineEditor.jsx';
import HowItWorks from './components/HowItWorks.jsx';
import { useScopeSlip } from './hooks/useScopeSlip.js';

export default function App() {
  const [howOpen, setHowOpen] = useState(false);
  const { state, changeRequest, useSample, runMatch, selectService, editOutline, download } = useScopeSlip();
  return <div className="app-shell">
    <header className="page-header"><span className="brand">Scope Slip</span><button type="button" className="how-button" onClick={() => setHowOpen(true)}>How it works</button></header>
    <main>
      <div className="introduction"><h1>Make the request clear.</h1><p>Match a client request to your services, then shape a work outline.</p></div>
      <div className="workspace">
        <RequestForm request={state.request} onChange={changeRequest} onSample={useSample} onFind={() => runMatch(state.request)} busy={state.operation === 'matching'} error={state.error} />
        <div className="result-region">
          <MatchingServices results={state.results} selectedId={state.outline?.serviceId} onSelect={selectService} modelPhase={state.modelPhase} operation={state.operation} />
          <OutlineEditor outline={state.outline} onEdit={editOutline} onDownload={download} downloadNote={state.downloadNote} />
        </div>
      </div>
    </main>
    <HowItWorks open={howOpen} onClose={() => setHowOpen(false)} />
  </div>;
}
