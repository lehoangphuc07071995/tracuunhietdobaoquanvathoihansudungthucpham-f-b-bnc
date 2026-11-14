export interface CompressedScanImage {
  base64: string;
  mimeType: string;
  previewDataUrl: string;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('INVALID_IMAGE_READ'));
      }
    };
    reader.onerror = () => reject(new Error('IMAGE_READ_FAILED'));
    reader.readAsDataURL(file);
  });
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('IMAGE_DECODE_FAILED'));
    img.src = src;
  });
}

/**
 * Compresses/resizes camera or gallery image cleanly to keep OCR text sharp
 * (up to 1400px longest side) while minimizing upload payload and latency.
 */
export async function prepareImageForVisionScan(
  file: File,
  maxDimension = 1400,
  jpegQuality = 0.86
): Promise<CompressedScanImage> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImageElement(objectUrl);
    const srcWidth = img.naturalWidth || img.width;
    const srcHeight = img.naturalHeight || img.height;

    if (!srcWidth || !srcHeight) {
      throw new Error('EMPTY_IMAGE_DIMENSIONS');
    }

    const scale = Math.min(1, maxDimension / Math.max(srcWidth, srcHeight));
    const targetWidth = Math.max(1, Math.round(srcWidth * scale));
    const targetHeight = Math.max(1, Math.round(srcHeight * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('CANVAS_UNAVAILABLE');
    }

    // White fill ensures transparent PNG stickers keep clean high-contrast OCR
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    const compressedDataUrl = canvas.toDataURL('image/jpeg', jpegQuality);
    const commaIdx = compressedDataUrl.indexOf(',');
    if (commaIdx === -1) {
      throw new Error('INVALID_DATA_URL');
    }

    return {
      base64: compressedDataUrl.slice(commaIdx + 1),
      mimeType: 'image/jpeg',
      previewDataUrl: compressedDataUrl,
    };
  } catch {
    // Fallback to raw DataURL if browser cannot draw format (e.g. HEIC on Safari)
    const rawDataUrl = await readFileAsDataUrl(file);
    const match = rawDataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) {
      throw new Error('UNSUPPORTED_IMAGE_FORMAT');
    }
    return {
      base64: match[2],
      mimeType: match[1] || file.type || 'image/jpeg',
      previewDataUrl: rawDataUrl,
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
