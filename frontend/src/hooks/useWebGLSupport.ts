import { useState } from 'react';

export interface WebGLSupportResult {
  supported: boolean;
  checked: boolean;
}

let cachedSupport: boolean | null = null;

function checkWebGLSupport(): boolean {
  if (cachedSupport !== null) {
    return cachedSupport;
  }

  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false;
  }

  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl');

    cachedSupport = Boolean(gl && 'getParameter' in gl);
  } catch {
    cachedSupport = false;
  }

  return cachedSupport;
}

/**
 * Hook that checks if WebGL is available by creating a test canvas context.
 * Memoizes the result to prevent redundant context creation.
 */
export function useWebGLSupport(): WebGLSupportResult {
  const [supportState] = useState<WebGLSupportResult>(() => ({
    supported: checkWebGLSupport(),
    checked: true,
  }));

  return supportState;
}

export default useWebGLSupport;
