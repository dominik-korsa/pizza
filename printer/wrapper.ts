import escpos from "escpos";
const EscposUsb = require("escpos-usb");

const device = new EscposUsb();

module.exports.openDevice = function openDevice(): Promise<void> {
    return new Promise((resolve, reject) => {
        device.open((error: any) => {
            if (error) reject(error);
            else resolve();
        })
    })
}

const printer = new escpos.Printer(device, {
    width: 32
} as {});
module.exports.printer = printer;

module.exports.closePrinter = function closePrinter(): Promise<void> {
    return new Promise((resolve, reject) => {
        printer.close((error) => {
            if (error) reject(error);
            else resolve();
        });
    })
}

module.exports.printQrImage = function printQrImage(content: string, options: { type: string; mode: string }): Promise<void> {
    return new Promise((resolve, reject) => {
        printer.qrimage(content, options, (error) => {
            if (error) reject(error);
            else resolve();
        });
    })
}
