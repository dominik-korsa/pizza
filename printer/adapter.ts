import { BluetoothSerialPort } from 'node-bluetooth-serial-port';
import Adapter = escpos.Adapter;

export default class BluetoothAdapter implements escpos.Adapter {
    private serial!: BluetoothSerialPort;

    private connect(address: string, channel: number) {
        return new Promise<void>((resolve, reject) => this.serial.connect(address, channel, () => resolve(), reject));
    }

    async open(callback: (error?: any) => void) {
        try {
            this.serial = new BluetoothSerialPort();
            const devices = await new Promise((resolve) => this.serial.listPairedDevices(resolve));
            const device = devices.find((device) => device.name === 'PT-280');
            const channel = await new Promise<number>((resolve) => this.serial.findSerialPortChannel(device.address, resolve));
            await this.connect(device.address, channel);
            callback();
        } catch (error) {
            callback(error);
        }
        return this;
    }

    write(data: Buffer, callback: (error?: any) => void) {
        this.serial.write(data, callback);
        return this;
    }
}
