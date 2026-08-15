"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SerialService = void 0;
const SerialPort = require('serialport');
const ReadlineParser = require('@serialport/parser-readline');
class SerialService {
    static initialize(io, portName = 'COM1', baudRate = 9600) {
        try {
            this.ioInstance = io;
            if (this.port) {
                if (this.port.isOpen) {
                    this.port.close();
                }
                this.port.removeAllListeners();
            }
            console.log(`[SerialPort] Connecting to port: ${portName}...`);
            // 🟢 ส่ง Callback การเปิดพอร์ตเข้าไปใน Constructor ของ SerialPort v9 โดยตรง
            this.port = new SerialPort(portName, { baudRate: baudRate }, (err) => {
                if (err) {
                    const msg = (err === null || err === void 0 ? void 0 : err.message) || String(err);
                    console.error(`[SerialPort Error] Cannot open ${portName}: ${msg}`);
                    if (this.ioInstance) {
                        this.ioInstance.emit('weight_stream', {
                            status: 'fail',
                            message: `Cannot open ${portName}: ${msg}`
                        });
                    }
                    return;
                }
                console.log(`[SerialPort Success] Connected to ${portName} successfully!`);
            });
            this.parser = this.port.pipe(new ReadlineParser({ delimiter: '\r\n' }));
            this.parser.on('data', (rawData) => {
                try {
                    console.log(`[SerialPort Stream] rawData: ${JSON.stringify(rawData)}`);
                    const match = rawData.match(/[-+]?\d+(\.\d+)?/);
                    if (match && this.ioInstance) {
                        const currentWeight = parseFloat(match[0]);
                        if (!isNaN(currentWeight)) {
                            console.log(`[SerialPort Stream] Weight: ${currentWeight} kg`);
                            this.ioInstance.emit('weight_stream', {
                                weight: currentWeight,
                                stable: rawData.includes('ST'),
                                status: 'success',
                                message: 'success'
                            });
                        }
                    }
                }
                catch (error) {
                    console.error('[SerialPort Stream Error]:', error.message);
                }
            });
            this.port.on('error', (err) => {
                const msg = (err === null || err === void 0 ? void 0 : err.message) || String(err);
                console.error(`[SerialPort Error] Runtime error: ${msg}`);
                if (this.ioInstance) {
                    this.ioInstance.emit('weight_stream', {
                        status: 'fail',
                        message: 'Serial Port runtime error: ' + msg
                    });
                }
            });
            this.port.on('close', () => {
                console.warn(`[SerialPort Warning] Port was closed!`);
                if (this.ioInstance) {
                    this.ioInstance.emit('weight_stream', {
                        status: 'fail',
                        message: 'Serial Port was closed'
                    });
                }
            });
        }
        catch (error) {
            console.error('[SerialPort System Error]:', error.message);
        }
    }
    static startMockStream() {
        if (this.mockTimer)
            clearInterval(this.mockTimer);
        console.log(`[Mock Mode] Started mock weight stream...`);
        let simulatedWeight = 0;
        let isIncreasing = true;
        this.mockTimer = setInterval(() => {
            if (!this.ioInstance)
                return;
            if (isIncreasing) {
                simulatedWeight += Math.random() * 4.5;
                if (simulatedWeight >= 50.0)
                    isIncreasing = false;
            }
            else {
                simulatedWeight -= Math.random() * 6.0;
                if (simulatedWeight <= 0) {
                    simulatedWeight = 0;
                    isIncreasing = true;
                }
            }
            const finalWeight = parseFloat(simulatedWeight.toFixed(2));
            this.ioInstance.emit('weight_stream', {
                weight: finalWeight,
                stable: finalWeight > 0 && Math.random() > 0.7,
                status: 'success',
                message: 'success'
            });
        }, 500);
    }
}
exports.SerialService = SerialService;
SerialService.port = null;
SerialService.parser = null;
SerialService.ioInstance = null;
SerialService.mockTimer = null;
//# sourceMappingURL=serial-service.js.map