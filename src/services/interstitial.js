import { ADMOB_INTERSTITIAL_ID } from '../constants';

let Ads = null;
try {
  Ads = require('react-native-google-mobile-ads');
} catch (e) {
  Ads = null;
}

const GAP_MS = 5 * 60 * 1000; // at most one ad every 5 minutes
let ad = null;
let loaded = false;
let lastShown = 0;

function load() {
  if (!Ads) return;
  const { InterstitialAd, AdEventType, TestIds } = Ads;
  ad = InterstitialAd.createForAdRequest(ADMOB_INTERSTITIAL_ID || TestIds.INTERSTITIAL, {
    requestNonPersonalizedAdsOnly: true,
  });
  loaded = false;
  ad.addAdEventListener(AdEventType.LOADED, () => { loaded = true; });
  ad.addAdEventListener(AdEventType.CLOSED, () => load());
  ad.addAdEventListener(AdEventType.ERROR, () => { loaded = false; });
  ad.load();
}

export function prepareInterstitial() {
  if (!ad) load();
}

export function showInterstitial() {
  try {
    if (ad && loaded && Date.now() - lastShown > GAP_MS) {
      lastShown = Date.now();
      ad.show();
    }
  } catch (e) {
    // ads must never break the app
  }
}
