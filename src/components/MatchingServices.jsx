import CheckIcon from './CheckIcon.jsx';

function statusCopy(modelPhase, operation) {
  if (operation === 'error') return 'No matching results are available.';
  if (modelPhase === 'loading') return 'Loading the matching model…';
  if (modelPhase === 'catalog') return 'Preparing the sample services…';
  if (operation === 'matching') return 'Comparing your request…';
  return 'Choose Find services to compare your request.';
}

export default function MatchingServices({ results, selectedId, onSelect, modelPhase, operation }) {
  return <section className="matching-region" aria-labelledby="matching-heading" aria-busy={operation === 'matching'}>
    <h2 id="matching-heading">Matching services</h2>
    {results.length ? <fieldset className="service-list">
      <legend className="visually-hidden">Choose one matching service</legend>
      {results.map((service) => <label className="service-row" key={service.id}>
        <span className="selection-control">
          <input type="radio" name="matching-service" value={service.id} checked={selectedId === service.id} onChange={() => onSelect(service.id)} />
          <span className="selection-box">{selectedId === service.id ? <CheckIcon /> : null}</span>
        </span>
        <span className="service-copy"><span className="service-title">{service.title}</span><span className="service-description">{service.description}</span></span>
      </label>)}
    </fieldset> : <p className="matching-status" role="status" aria-live="polite">{statusCopy(modelPhase, operation)}</p>}
  </section>;
}
