/**
 * mediaService.js - Zero-Budget Media Persistence Utility
 * Compresses images and converts them to Base64 to stay within Firestore document limits (1MB).
 */

export const compressAndConvertToBase64 = (file, maxWidth = 1200, quality = 0.7) => {
  return new Promise((resolve, reject) => {
    if (!file || !file.type) {
        return reject("Invalid file.");
    }

    if (!file.type.startsWith('image/')) {
      // For non-images (like videos), we convert to Base64 but warn about size
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to low-quality JPEG to minimize size
        const base64 = canvas.toDataURL('image/jpeg', quality);
        
        // Final check: Firestore doc limit is 1MB. Let's stay safe under 800KB.
        if (base64.length > 800000) {
          // If still too big, re-compress with lower quality
          resolve(canvas.toDataURL('image/jpeg', quality * 0.5));
        } else {
          resolve(base64);
        }
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

/**
 * Uploads a file directly to Cloudinary bypassing Firebase Storage.
 * @param {Blob|File} file - The file to upload.
 * @param {Function} [onProgress] - Optional progress callback `(percentCompleted) => {}`.
 * @returns {Promise<string>} The secure HTTPS URL of the uploaded image/video.
 */
export const uploadToCloudinary = (file, onProgress = null) => {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error("No file provided for upload."));

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      return reject(new Error("Cloudinary environment variables missing. Did you add them to .env?"));
    }

    const isVideo = file.type && file.type.startsWith('video/');
    const resourceType = isVideo ? 'video' : 'image';
    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', uploadUrl, true);

    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = (e.loaded / e.total) * 100;
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response.secure_url);
        } catch (e) {
          reject(new Error("Failed to parse Cloudinary response."));
        }
      } else {
        console.error("Cloudinary upload failed:", xhr.responseText);
        reject(new Error(`Cloudinary upload failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error("Network error during Cloudinary upload."));
    xhr.send(formData);
  });
};
