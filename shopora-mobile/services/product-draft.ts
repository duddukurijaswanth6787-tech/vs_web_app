import type { CreatedProductSummary } from './api';

/**
 * Hand-off slot between the add-product wizard and the label screen.
 *
 * The barcodes are issued by the backend (one per variant) and there can be
 * dozens of them, which is more than expo-router should carry through query
 * params — so the result is parked here and read once on the next screen.
 */
let lastCreatedProduct: CreatedProductSummary | null = null;

export function setLastCreatedProduct(summary: CreatedProductSummary) {
  lastCreatedProduct = summary;
}

export function getLastCreatedProduct(): CreatedProductSummary | null {
  return lastCreatedProduct;
}

export function clearLastCreatedProduct() {
  lastCreatedProduct = null;
}
