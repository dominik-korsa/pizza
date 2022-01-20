export interface ReceiptDataPerson {
    personName: string;
    pieces: number;
    piecesPrice: string;
    additionalFee: string;
    totalPrice: string;
    qrContent: string;
    drink: 'own-cup' | 'single-use-cup' | null;
}

export interface ReceiptDataCommon {
    date: string;
    pricePerPiece: string;
    drinkFee: string;
    cupFee: string;
    receiver: string;
    phone: string;
    account: string;
}

export type ReceiptData = ReceiptDataPerson & ReceiptDataCommon;
