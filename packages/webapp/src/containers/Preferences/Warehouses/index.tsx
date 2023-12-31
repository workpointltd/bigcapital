// @ts-nocheck
import React from 'react';
import { WarehousesProvider } from './WarehousesProvider';
import Warehouses from './Warehouses';

/**
 * Warehouses Preferences.
 * @returns
 */
export default function WarehousesPerences() {
  return (
    <WarehousesProvider>
      <Warehouses />
    </WarehousesProvider>
  );
}
