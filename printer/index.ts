const {openDevice, printer, printQrImage} = require("./wrapper");

interface ReceiptData {
    date: string;
    personName: string;
    pricePerPiece: string;
    pieces: number;
    totalPrice: string;
    qrContent: string;
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
                { text: "Cena:", align:"LEFT", width:0.2 },
                { text: `${data.pieces} * ${data.pricePerPiece}`, align:"RIGHT", width:0.8, style: 'b' }
            ]
        )
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
    await new Promise((resolve) => setTimeout(resolve, 1000));
    process.exit(0);
}

printReceipt({}).catch(console.error);
