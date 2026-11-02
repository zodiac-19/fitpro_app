import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { ADMOB_BANNER_ID } from '../constants';

let Ads = null;
try {
  Ads = require('react-native-google-mobile-ads');
} catch (e) {
  Ads = null;
}

let started = false;

export default function AdBanner() {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (Ads && !started) {
      started = true;
      Ads.default().initialize().catch(() => {});
    }
  }, []);

  if (!Ads || failed) return null;
  const { BannerAd, BannerAdSize, TestIds } = Ads;
  const unitId = ADMOB_BANNER_ID || TestIds.BANNER;

  return (
    <View style={{ alignItems: 'center', marginTop: 6 }}>
      <BannerAd
        unitId={unitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
        onAdFailedToLoad={() => setFailed(true)}
      />
    </View>
  );
}
