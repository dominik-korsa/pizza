export interface ReceiptDataPerson {
    personName: string;
    pieces: number;
    piecesPrice: string;
    totalPrice: string;
    qrContent: string;
    drink: 'own-cup' | 'single-use-cup' | null;
}

export interface ReceiptDataCommon {
    date: string;
    pricePerPiece: string;
    drinkFee: string;
    cupFee: string;
    additionalFee: string;
    receiver: string;
    phone: string;
    account: string;
}

export type ReceiptData = ReceiptDataPerson & ReceiptDataCommon;
