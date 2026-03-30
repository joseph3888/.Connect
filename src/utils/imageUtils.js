// Advanced image processing utility for Connect Premium
// Handles compression, resizing, and CSS-style filter application via Canvas

export const processImage = (input, maxWidth = 1200, filterId = 'none') => {
  return new Promise((resolve, reject) => {
    if (!input) return resolve(null);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = input;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Maintain aspect ratio
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      // Apply Filter via Canvas context
      const filterStyles = {
        none: 'none',
        grayscale: 'grayscale(100%)',
        sepia: 'sepia(80%)',
        vibrant: 'saturate(180%) contrast(110%)',
        warm: 'sepia(30%) saturate(140%) hue-rotate(-10deg)',
        cool: 'saturate(120%) hue-rotate(180deg) brightness(1.1)'
      };

      if (filterId !== 'none' && filterStyles[filterId]) {
        ctx.filter = filterStyles[filterId];
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Convert to efficient JPEG
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      resolve(dataUrl);
    };

    img.onerror = (error) => {
      console.error("Image processing failed:", error);
      reject(error);
    };
  });
};
