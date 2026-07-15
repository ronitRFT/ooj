export function isMobileSafari() {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
}

export async function fetchAssetBlob(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch asset (${response.status})`);
  }
  const contentType = response.headers.get('content-type') || '';
  const blob = await response.blob();
  if (blob.size === 0) {
    throw new Error('Downloaded file is empty');
  }
  return { blob, contentType };
}

export async function downloadFileAsBlob(url, filename) {
  const { blob } = await fetchAssetBlob(url);
  const blobUrl = URL.createObjectURL(blob);

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isPdf = filename.toLowerCase().endsWith('.pdf');

  if (isIOS || (isMobileSafari() && isPdf)) {
    const opened = window.open(blobUrl, '_blank', 'noopener,noreferrer');
    if (!opened) {
      window.location.href = blobUrl;
    }
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    return { method: 'open' };
  }

  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(blobUrl);
  return { method: 'download' };
}

export function saveBlobAsDownload(blob, filename) {
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(blobUrl);
}
