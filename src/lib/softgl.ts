/** Soft-GL / SwiftShader — Chromebook Error 9 if we run the Haute path. */

let soft = false;

/**
 * Detect software GL without creating a SwiftShader context.
 * A probe + loseContext + R3F canvas = two software contexts → Error 9.
 * failIfMajorPerformanceCaveat fails closed on SwiftShader (returns null).
 */
export function detectSoftGL(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const opts: WebGLContextAttributes = { failIfMajorPerformanceCaveat: true, antialias: false };
    const hw =
      canvas.getContext("webgl", opts) ||
      canvas.getContext("experimental-webgl", opts);
    if (!hw || !(hw instanceof WebGLRenderingContext)) {
      // No hardware GL — do not open a software context just to inspect it.
      return true;
    }
    const ext = hw.getExtension("WEBGL_debug_renderer_info");
    const renderer = ext ? String(hw.getParameter(ext.UNMASKED_RENDERER_WEBGL) ?? "") : "";
    const vendor = ext ? String(hw.getParameter(ext.UNMASKED_VENDOR_WEBGL) ?? "") : "";
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
