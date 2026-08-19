import { apiGet, apiPost } from "./api";
import type {
  CreatePurchasePayload,
  PaymentOrderResult,
  Purchase,
  VerifyPaymentPayload,
} from "./types";

const PURCHASES = "/api/v1/purchases";
const BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

/**
 * POST /api/v1/purchases/orders
 * Initiates product purchase order and returns Razorpay order details.
 */
export function createPurchaseOrder(
  payload: CreatePurchasePayload
): Promise<PaymentOrderResult> {
  return apiPost<PaymentOrderResult>(`${PURCHASES}/orders`, payload);
}

/**
 * POST /api/v1/purchases/verify
 * Verifies Razorpay checkout signature and creates purchase record.
 */
export function verifyPurchase(
  payload: VerifyPaymentPayload
): Promise<Purchase> {
  return apiPost<Purchase>(`${PURCHASES}/verify`, payload);
}

/**
 * GET /api/v1/purchases/
 * Buyer: get list of purchased items.
 */
export function getPurchaseHistory(): Promise<Purchase[]> {
  return apiGet<Purchase[]>(`${PURCHASES}/`);
}

/**
 * GET /api/v1/purchases/sales
 * Creator: get sales records of own digital products.
 */
export function getCreatorSales(): Promise<Purchase[]> {
  return apiGet<Purchase[]>(`${PURCHASES}/sales`);
}

/**
 * GET /api/v1/purchases/:id/download
 * Buyer: download purchased file blob directly in browser.
 */
export async function downloadPurchaseFile(purchaseId: string, fallbackFileName?: string): Promise<void> {
  const url = `${BASE_URL}${PURCHASES}/${purchaseId}/download`;
  const res = await fetch(url, {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    let errMsg = "Download failed";
    if (res.status === 401) {
      errMsg = "Authentication required. Please sign in to download this asset.";
    } else if (res.status === 403) {
      errMsg = "Download access denied. The link may be expired or the download limit reached.";
    } else if (res.status === 404) {
      errMsg = "Purchased file was not found on the server.";
    } else {
      try {
        const errJson = await res.json();
        if (errJson.message) errMsg = errJson.message;
      } catch {
        // ignore
      }
    }
    throw new Error(errMsg);
  }

  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition");
  let fileName = fallbackFileName ? fallbackFileName.replace(/[\\/:*?"<>|]/g, "_") : "downloaded-asset";

  if (disposition && disposition.includes("filename=")) {
    const match = disposition.match(/filename="?([^"]+)"?/);
    if (match && match[1]) fileName = match[1];
  }

  // If filename lacks extension, infer from mime type
  if (!fileName.includes(".")) {
    const mime = blob.type.toLowerCase();
    if (mime.includes("pdf")) fileName += ".pdf";
    else if (mime.includes("zip")) fileName += ".zip";
    else if (mime.includes("png")) fileName += ".png";
    else if (mime.includes("jpeg") || mime.includes("jpg")) fileName += ".jpg";
    else if (mime.includes("json")) fileName += ".json";
    else if (mime.includes("epub")) fileName += ".epub";
    else if (mime.includes("mp4")) fileName += ".mp4";
    else if (mime.includes("audio") || mime.includes("mp3")) fileName += ".mp3";
    else fileName += ".zip";
  }

  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = downloadUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(downloadUrl);
}
