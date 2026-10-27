import { publicUrl } from "../../../../packages/env/src/endpoints";
export const CUSTOMER_API_ORIGIN = publicUrl("VITE_API_ORIGIN");
export const CUSTOMER_AUTH_BASE = `${CUSTOMER_API_ORIGIN}/v1/auth`;
export const CUSTOMER_API_BASE = `${CUSTOMER_API_ORIGIN}/v1/customer`;
