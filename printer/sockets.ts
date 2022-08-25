import WebSocket from "ws";
import {Channel} from "queueable";
import type {ReceiptData} from "./index";

export function connectWebsocket(): Promise<Channel<ReceiptData>> {
    return new Promise((resolve, reject) => {
        const ws = new WebSocket('ws://localhost/ws');
        const channel = new Channel<ReceiptData>();
        ws.on('open', () => {resolve(channel);});
        ws.on('message', (msg: Buffer | string) => {
            if (typeof msg !== 'string') msg = msg.toString('utf-8');
            void channel.push(JSON.parse(msg) as ReceiptData);
        });
        ws.on('error', (error) => {reject(error)});
    });
}
