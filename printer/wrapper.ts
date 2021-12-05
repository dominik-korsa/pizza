import escpos, {Image} from "escpos";
import qr from "qr-image";
import getPixels from 'get-pixels';
import EscposUsb from "escpos-usb";
import sharp from 'sharp';
import * as util from "util";

export async function getPrinter() {
    const device = new EscposUsb();
    const printer = new escpos.Printer(device, {
        width: 32
    } as {});
    await openDevice(device);
    return printer;
}

const getPixelsAsync = util.promisify(getPixels);

export function openDevice(device: escpos.Adapter): Promise<void> {
    return new Promise((resolve, reject) => {
        device.open((error: any) => {
            if (error) reject(error);
            else resolve();
        })
    })
}

export function flushPrinter(printer: escpos.Printer): Promise<void> {
    return new Promise((resolve, reject) => {
        printer.flush((error) => {
            if (error) reject(error);
            else resolve();
        });
    })
}

export function printQrImage(printer: escpos.Printer, content: string, options: { type: string; mode: string, size: number }): Promise<void> {
    return new Promise((resolve, reject) => {
        printer.qrimage(content, options, (error) => {
            if (error) reject(error);
            else resolve();
        });
    })
}

export async function printQrWithLogo(printer: escpos.Printer, content: string) {
    const transformer = sharp()
        .composite([{ input: './logo.png', gravity: 'center' }])
        .png();
    const qrImage = qr.image(content, {
        type: 'png',
        size: 4,
        ec_level: 'H'
    });
    qrImage.pipe(transformer);
    // const s1 = sharp().png().on('info', info => {
    //     console.log(info);
    // });
    // qrImage.pipe(s1);
    // console.log('piped');
    // await transformer.toFile('test.png');
    const imageBuffer = await transformer.toBuffer();
    const pixels = await getPixelsAsync(imageBuffer, 'image/png');
    const image = new Image(pixels);
    printer.image(image, 'S24');
}
