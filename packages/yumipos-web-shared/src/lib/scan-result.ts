export interface ScanResultData {
	type: string;
	name: string; // Merchant Name
	category: string;
	merchant?: string; // Optional alias for name
	transactionType: "expense" | "income" | "unknown";
	total: number;
	subtotal?: number;
	tax?: number;
	serviceCharge?: number;
	discount?: number;
	items: Array<{ name: string; qty: number; price: number; subtotal: number; unit?: string }>;
	date?: string | null;
	time?: string;
	receiptNumber?: string;
	paymentMethod: string;
	notes?: string;
	confidence: number;
	rawText?: string;
	rewrittenText?: string;
}

export type BulkScanResult = { success: boolean; data?: ScanResultData; error?: string; index?: number };
