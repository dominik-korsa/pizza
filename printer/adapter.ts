import BluetoothClassicSerialportClient from 'bluetooth-classic-serialport-client';

export default class BluetoothAdapter implements escpos.Adapter {
    private serial: any;

    async open(callback: (error?: any) => void) {
        try {
            this.serial = new BluetoothClassicSerialportClient();
            const devices = await this.serial.listPairedDevices();
            const device = devices.find((device) => device.name === 'PT-280');
            await this.serial.connect(device.address);
            callback();
        } catch (error) {
            callback(error);
        }
        return this;
    }

    write(data: Buffer, callback: (error?: any) => void) {
        this.serial.write(data)
            .then(() => callback())
            .catch((error) => callback(error));
    }
}
