import { FormEvent, useState } from 'react';
import { DateOrder, DemoCity, DemoSignal, DiscoveryMode, getDemoSignals, resolveDemoPlace } from './siteModel';

export function useDemoScene() {
  const [city, setCity] = useState<DemoCity>('Kolkata');
  const [mode, setMode] = useState<DiscoveryMode>('work');
  const [genre, setGenre] = useState('All sounds');
  const [order, setOrder] = useState<DateOrder>('soonest');
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('Showing a sample Kolkata scene. Choose a city or try a demo PIN.');
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<DemoSignal | null>(null);
  const signals = getDemoSignals(city, genre, order);

  const selectCity = (value: DemoCity) => {
    setCity(value); setQuery(''); setError('');
    setMessage(`Sample scene set to ${value}. These are fictional product previews, not device-location results.`);
  };
  const submitPlace = (event: FormEvent) => {
    event.preventDefault();
    const result = resolveDemoPlace(query);
    if (result.error) { setError(result.error); return; }
    if (result.city) {
      setCity(result.city); setError('');
      setMessage(`Demo scene set to ${result.city}. No device location was requested or stored.`);
    }
  };
  const updateQuery = (value: string) => { setQuery(value.slice(0, 64)); setError(''); };
  const useDemoLocation = () => {
    setCity('Kolkata'); setQuery('700001'); setError('');
    setMessage('Demo location set to Kolkata. No device location was requested or stored.');
  };
  const openSignal = (signal: DemoSignal, view: DiscoveryMode) => { setMode(view); setSelected(signal); };

  return { city, mode, setMode, genre, setGenre, order, setOrder, query, updateQuery, message, error, signals, selected, setSelected, selectCity, submitPlace, useDemoLocation, openSignal };
}

export type DemoScene = ReturnType<typeof useDemoScene>;
