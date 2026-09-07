/** Soft-GL / SwiftShader — Chromebook Error 9 if we run the Haute path. */

let soft = false;

export function detectSoftGL(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl || !(gl instanceof WebGLRenderingContext)) return true;
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) ?? "") : "";
    const vendor = ext ? String(gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) ?? "") : "";
    const blob = `${renderer} ${vendor}`.toLowerCase();
    return /swiftshader|llvmpipe|software|microsoft basic|mesa offscreen|gdi generic/.test(blob);
  } catch {
    return true;
  }
}

export function setSoftGL(next: boolean) {
  soft = next;
}

export function getSoftGL() {
  return soft;
}
