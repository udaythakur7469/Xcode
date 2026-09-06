/**
 * Renders the visible portion of an image inside a square crop "stage" as a
 * circular PNG, given the same origin/scale values the crop dialog's drag +
 * zoom interaction produces.
 *
 * `stageSize` is the on-screen pixel size of the square crop stage the user
 * was dragging/zooming inside (e.g. 320). `outputSize` is the resolution of
 * the final circular PNG we upload (e.g. 400x400).
 */
export type CropTransform = {
  originX: number;
  originY: number;
  scale: number;
};

export async function renderCircularCrop(
  imageSrc: string,
  transform: CropTransform,
  stageSize: number,
  outputSize = 400,
): Promise<Blob> {
  const image = await loadImage(imageSrc);

  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context is not available");

  const outputScale = outputSize / stageSize;

  ctx.save();
  ctx.beginPath();
  ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
  ctx.clip();

  ctx.drawImage(
    image,
    0,
    0,
    image.naturalWidth,
    image.naturalHeight,
    transform.originX * outputScale,
    transform.originY * outputScale,
    image.naturalWidth * transform.scale * outputScale,
    image.naturalHeight * transform.scale * outputScale,
  );

  ctx.restore();

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Failed to render cropped image"));
    }, "image/png");
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Captures the current mirrored <video> frame from a selfie camera into a data URL. */
export function captureMirroredFrame(video: HTMLVideoElement): string {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context is not available");

  // Flip horizontally so the captured photo matches the mirrored preview
  // the user was looking at.
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0);

  return canvas.toDataURL("image/png");
}
