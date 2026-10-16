// Server-side only. The invented paper delivery orders used by the photo-intake demo, read through the manifest-enforcing loader.

import { loadBinaryDataset } from "./loaders";

export const DO_IMAGE_IDS = ["do-01", "do-02"] as const;
export type DoImageId = (typeof DO_IMAGE_IDS)[number];

export const isDoImageId = (id: string): id is DoImageId => (DO_IMAGE_IDS as readonly string[]).includes(id);

export const doImageFile = (id: DoImageId): string => `synthetic/do-images/${id}.png`;

export function loadDoImage(id: DoImageId): { bytes: Buffer; mediaType: "image/png" } {
  return { bytes: loadBinaryDataset(doImageFile(id)).bytes, mediaType: "image/png" };
}

export const doImageLabel = (id: DoImageId): string => `Paper delivery order sample ${Number(id.slice(3))}`;
