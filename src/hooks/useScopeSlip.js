import { useCallback, useEffect, useRef, useState } from 'react';
import { SAMPLE_REQUEST, SERVICE_BY_ID } from '../data/services.js';
import { normalizeRequest } from '../domain/matching.js';
import { buildOutlineMarkdown, createOutline } from '../domain/outline.js';
import { getMatcherClient } from '../model/matcherClient.js';

const INITIAL = {
  request: SAMPLE_REQUEST, matchedRequest: '', results: [], outline: null,
  modelPhase: 'loading', operation: 'matching', error: '', downloadNote: '',
};

export function useScopeSlip() {
  const [state, setState] = useState(INITIAL);
  const clientRef = useRef(null);
  const mounted = useRef(false);
  const requestVersion = useRef(0);

  const runMatch = useCallback(async (request) => {
    let text;
    try {
      text = normalizeRequest(request);
    } catch {
      ++requestVersion.current;
      setState((current) => ({ ...current, results: [], outline: null, operation: 'idle', error: 'Add a request of up to 800 characters.', downloadNote: '' }));
      return;
    }
    const version = ++requestVersion.current;
    setState((current) => ({ ...current, results: [], outline: null, matchedRequest: '', operation: 'matching', error: '', downloadNote: '' }));
    try {
      const { results } = await clientRef.current.match(text);
      if (!mounted.current || version !== requestVersion.current) return;
      const first = SERVICE_BY_ID.get(results[0]?.id);
      if (!first) throw new Error('MATCH_FAILED');
      setState((current) => ({ ...current, results, outline: createOutline(first), matchedRequest: text, operation: 'ready', error: '' }));
    } catch (error) {
      if (!mounted.current || version !== requestVersion.current) return;
      const message = error.message === 'MODEL_LOAD_FAILED'
        ? 'The model could not load. Check your connection and try Find services again.'
        : 'The request could not be compared. Please try Find services again.';
      setState((current) => ({ ...current, results: [], outline: null, operation: 'error', error: message }));
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    const client = getMatcherClient();
    clientRef.current = client;
    const unsubscribe = client.subscribe((phase) => {
      if (mounted.current) setState((current) => ({ ...current, modelPhase: phase }));
    });
    // Required automatic first sample: real model output, never seeded results.
    void runMatch(SAMPLE_REQUEST);
    return () => {
      mounted.current = false;
      ++requestVersion.current;
      unsubscribe();
      client.dispose();
      clientRef.current = null;
    };
  }, [runMatch]);

  const changeRequest = useCallback((value) => {
    ++requestVersion.current;
    const request = Array.from(value).slice(0, 800).join('');
    setState((current) => ({ ...current, request, results: [], outline: null, matchedRequest: '', operation: 'idle', error: '', downloadNote: '' }));
  }, []);

  const useSample = useCallback(() => {
    changeRequest(SAMPLE_REQUEST);
    void runMatch(SAMPLE_REQUEST);
  }, [changeRequest, runMatch]);

  const selectService = useCallback((id) => {
    const service = SERVICE_BY_ID.get(id);
    if (!service) return;
    setState((current) => current.results.some((result) => result.id === id)
      ? { ...current, outline: createOutline(service), downloadNote: '' }
      : current);
  }, []);

  const editOutline = useCallback((field, value) => {
    if (!['included', 'confirmFirst'].includes(field)) return;
    setState((current) => current.outline
      ? { ...current, outline: { ...current.outline, [field]: value.slice(0, 2000) }, downloadNote: '' }
      : current);
  }, []);

  const download = useCallback(() => {
    if (!state.outline || state.operation !== 'ready') return;
    const content = buildOutlineMarkdown({ request: state.matchedRequest, outline: state.outline });
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'scope-slip-outline.md';
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setState((current) => ({ ...current, downloadNote: 'Outline download started.' }));
  }, [state.outline, state.operation, state.matchedRequest]);

  return { state, changeRequest, useSample, runMatch, selectService, editOutline, download };
}
