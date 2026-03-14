const MAX_OUTPUT_SIZE = 1 * 1024 * 1024; // 1 MB
const MAX_DIMENSION = 1920;

/**
 * Compress an image File to approximately 1MB.
 * Returns a Uint8Array of the compressed JPEG bytes.
 */
export async function compressImage(file: File): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement("canvas");
      let { width, height } = img;

      // Scale down if larger than max dimension
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);

      // Try decreasing quality until under MAX_OUTPUT_SIZE
      let quality = 0.85;
      const tryCompress = () => {
        canvas.toBlob(
          async (blob) => {
            if (!blob) {
              reject(new Error("Canvas toBlob failed"));
              return;
            }
            if (blob.size <= MAX_OUTPUT_SIZE || quality <= 0.2) {
              const arrayBuffer = await blob.arrayBuffer();
              resolve(new Uint8Array(arrayBuffer));
            } else {
              quality -= 0.1;
              tryCompress();
            }
          },
          "image/jpeg",
          quality,
        );
      };
      tryCompress();
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image"));
    };

    img.src = objectUrl;
  });
}

/**
 * Read a video file as Uint8Array (no compression, just read).
 */
export async function readVideoFile(file: File): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}
