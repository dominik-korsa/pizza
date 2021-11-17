export interface ReceiptDataPerson {
    personName: string;
    pieces: number;
    totalPrice: string;
    qrContent: string;
}

export interface ReceiptDataCommon {
    date: string;
    pricePerPiece: string;
    receiver: string;
    phone: string;
    account: string;
}

export type ReceiptData = ReceiptDataPerson & ReceiptDataCommon;
