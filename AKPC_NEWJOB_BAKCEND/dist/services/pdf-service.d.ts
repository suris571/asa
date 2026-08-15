interface LabelData {
    grade: string;
    size: string;
    weight: string;
    diameter: string;
    date: string;
    rollNo: string;
    barcodeImg: string;
    status: string;
}
export declare function generateLabelPdf(data: LabelData): Promise<string>;
export {};
//# sourceMappingURL=pdf-service.d.ts.map