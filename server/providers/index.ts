import type { CricketDataProvider } from './types';
import { DemoCricketProvider } from './demoProvider.js';
import { SportmonksCricketProvider } from './sportmonksProvider.js';

let singletonProvider: CricketDataProvider | null = null;

export function getCricketProvider(): CricketDataProvider {
  if (singletonProvider) return singletonProvider;

  const sportmonksToken = process.env.SPORTMONKS_API_TOKEN?.trim();
  if (sportmonksToken && sportmonksToken.length > 8 && sportmonksToken !== 'MY_SPORTMONKS_API_TOKEN') {
    singletonProvider = new SportmonksCricketProvider(sportmonksToken);
  } else {
    singletonProvider = new DemoCricketProvider();
  }
  return singletonProvider;
}
