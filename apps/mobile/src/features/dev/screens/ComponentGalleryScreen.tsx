import React from 'react';
import { Screen, Text } from '../../../shared/components';
import { GalleryData } from '../components/GalleryData';
import { GalleryInputs } from '../components/GalleryInputs';
import { GallerySettings } from '../components/GallerySettings';

/** Debug-only copy of the design's Components sheet, for visual checks in every theme/language. */
export function ComponentGalleryScreen() {
  return (
    <Screen>
      <Text variant="display">مكوّنات لمّة</Text>
      <GallerySettings />
      <GalleryInputs />
      <GalleryData />
    </Screen>
  );
}
