/** What the image picker hands back for one photo. */
export interface PickedAsset {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
  width?: number;
  height?: number;
  fileSize?: number;
}

/** A photo ready to upload: shrunk, validated, with a URI to preview it. */
export interface PreparedPhoto {
  body: Blob | ArrayBuffer;
  type: string;
  size: number;
  name: string;
  preview: string;
}
