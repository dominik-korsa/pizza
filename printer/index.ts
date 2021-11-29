import {connectWebsocket} from "./sockets";
import {closePrinter, getPrinter, printQrWithLogo} from "./wrapper";
import escpos from "escpos";

export interface ReceiptData {
    personName: string;
    pieces: number;
    piecesPrice: string;
    totalPrice: string;
    qrContent: string;
    ownCup: boolean;

    date: string;
    pricePerPiece: string;
    drinkFee: string;
    cupFee: string;
    additionalFee: string;
    receiver: string;
    phone: string;
    account: string;
}

async function printReceipt(printer: escpos.Printer, data: ReceiptData) {
    printer
        .encode('cp852')
        .setCharacterCodeTable(18)
        .font('A')
        .size(0, 0)
        .align('CT')
        .style('NORMAL')
        .text(`Pizza ${data.date}`)
        .tableCustom(
            [
                { text: "Dla:", align:"LEFT", width:0.3 },
                { text: data.personName, align:"RIGHT", width:0.7, style: 'B' }
            ],
        )
        .feed()
        .tableCustom(
            [
                { text: "Kawałki:", align:"LEFT", cols: 9 },
                { text: `${data.pieces}x ${data.pricePerPiece}`, cols: 11, align:"RIGHT" },
                { text: data.piecesPrice, align:"RIGHT", cols: 10, style: 'b' },
            ],
        )
        .style('NORMAL')
        .tableCustom(
            [
                { text: "Napoje:", align:"LEFT", width:0.6 },
                { text: `${data.drinkFee}`, align:"RIGHT", width:0.4, style: 'b' }
            ],
        )
        .tableCustom(
            [
                { text: "Opłata za kubek:", align:"LEFT", width:0.6 },
                { text: data.ownCup ? '-' : `${data.cupFee}`, align:"RIGHT", width:0.4, style: 'b' }
            ],
        )
        .tableCustom(
            [
                { text: "Opłata dodatkowa:", align:"LEFT", width:0.6 },
                { text: `${data.additionalFee}`, align:"RIGHT", width:0.4, style: 'b' }
            ],
        )
        .align('LT')
        .text('Razem:')
        .size(1, 1)
        .align('RT')
        .text(data.totalPrice)
        .size(0, 0)
        .feed()
        .drawLine('─')
        .align('CT');
    await printQrWithLogo(printer, data.qrContent);
    printer
        .feed()
        .tableCustom([
            { text:"Odbiorca:", align:"LEFT", width:0.4 },
            { text: data.receiver, align:"RIGHT", width:0.6, style: 'B' }
        ])
        .tableCustom([
            { text:"BLIK:", align:"LEFT", width:0.4 },
            { text: data.phone, align:"RIGHT", width:0.6, style: 'b' }
        ])
        .align('LT')
        .style('NORMAL')
        .text('Przelew:')
        .align('RT')
        .style('B')
        .text(data.account)
        .feed(2);
    await closePrinter(printer);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    printer.beep(0, 0);
}

async function main() {
    let printer: escpos.Printer;
    while (true) {
        try {
            printer = await getPrinter();
            break;
        } catch (error) {
            if (error instanceof Error) console.log(error.message);
            else console.error(error);
            await new Promise((resolve) => setTimeout(resolve, 10000));
        }
    }
    const channel = await connectWebsocket();
    console.log('Connected');
    for await (const msg of channel) {
        await printReceipt(printer, msg);
        console.log('Printed');
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
})
