export interface PreparedPhoto {
  blob: Blob;
  previewUrl: string;
  width: number | null;
  height: number | null;
}

const MAX_DIMENSION = 1600;
const QUALITY = 0.85;
const SKIP_COMPRESSION_BYTES = 1.5 * 1024 * 1024;

export async function preparePhoto(file: File): Promise<PreparedPhoto> {
  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;
    const longest = Math.max(width, height);
    const fitsWithoutCompression =
      longest <= MAX_DIMENSION && file.size <= SKIP_COMPRESSION_BYTES;

    if (fitsWithoutCompression) {
      bitmap.close();
      return {
        blob: file,
        previewUrl: URL.createObjectURL(file),
        width,
        height,
      };
    }

    const scale = Math.min(1, MAX_DIMENSION / longest);
    const targetWidth = Math.max(1, Math.round(width * scale));
    const targetHeight = Math.max(1, Math.round(height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Sin contexto 2D");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, targetWidth, targetHeight);
    context.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", QUALITY),
    );
    if (!blob) throw new Error("Sin blob");
    return {
      blob,
      previewUrl: URL.createObjectURL(blob),
      width: targetWidth,
      height: targetHeight,
    };
  } catch {
    return {
      blob: file,
      previewUrl: URL.createObjectURL(file),
      width: null,
      height: null,
    };
  }
}
