export interface ReceiptDataPerson {
    personName: string;
    pieces: number;
    piecesPrice: string;
    totalPrice: string;
    qrContent: string;
}

export interface ReceiptDataCommon {
    date: string;
    pricePerPiece: string;
    drinkFee: string;
    additionalFee: string;
    receiver: string;
    phone: string;
    account: string;
}

export type ReceiptData = ReceiptDataPerson & ReceiptDataCommon;
