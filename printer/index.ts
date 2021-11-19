import {connectWebsocket} from "./sockets";

const {openDevice, printer, printQrImage} = require("./wrapper");

export interface ReceiptData {
    personName: string;
    pieces: number;
    piecesPrice: string;
    totalPrice: string;
    qrContent: string;

    date: string;
    pricePerPiece: string;
    drinkFee: string;
    additionalFee: string;
    receiver: string;
    phone: string;
    account: string;
}

async function printReceipt(data: ReceiptData) {
    await openDevice();
    printer
        .encode('cp852')
        .setCharacterCodeTable([18])
        .font('a')
        .size(0, 0)
        .align('ct')
        .text(`Pizza ${data.date}`)
        .style('b')
        .text(data.personName)
        .style('normal')
        .feed()
        .tableCustom(
            [
                { text: "Kawałki:", align:"LEFT", cols: 9 },
                { text: `${data.pieces}x ${data.pricePerPiece}`, cols: 11, align:"RIGHT" },
                { text: data.piecesPrice, align:"RIGHT", cols: 10, style: 'b' },
            ],
        )
        .style('normal')
        .tableCustom(
            [
                { text: "Napoje:", align:"LEFT", width:0.6 },
                { text: `${data.drinkFee}`, align:"RIGHT", width:0.4, style: 'b' }
            ],
        )
        .tableCustom(
            [
                { text: "Opłata dodatkowa:", align:"LEFT", width:0.6 },
                { text: `${data.additionalFee}`, align:"RIGHT", width:0.4, style: 'b' }
            ],
        )
        .align('lt')
        .text('Razem:')
        .size(1, 1)
        .align('rt')
        .text(data.totalPrice)
        .size(0, 0)
        .feed()
        .drawLine('─')
        .align('ct');
    await printQrImage(data.qrContent, { type: 'png', mode: 'dhdw', size: 3 });
    printer
        .feed()
        .tableCustom([
            { text:"Odbiorca:", align:"LEFT", width:0.4 },
            { text: data.receiver, align:"RIGHT", width:0.6, style: 'b' }
        ])
        .tableCustom([
            { text:"BLIK:", align:"LEFT", width:0.4 },
            { text: data.phone, align:"RIGHT", width:0.6, style: 'b' }
        ])
        .align('lt')
        .style('normal')
        .text('Przelew:')
        .align('rt')
        .style('b')
        .text(data.account)
        .feed(2);
    await printer.close();
    await new Promise((resolve) => setTimeout(resolve, 2000));
    printer.beep(0, 0);
}

async function main() {
    const channel = await connectWebsocket();
    console.log('WebSocket connected');
    for await (const msg of channel) {
        await printReceipt(msg);
        console.log('Printed');
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
})

