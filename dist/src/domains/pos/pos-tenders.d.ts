export interface TenderInput {
    method: string;
    amount: number;
}
export interface TenderAllocation {
    method: string;
    amount: number;
}
export interface TenderSplit {
    allocations: TenderAllocation[];
    changeDue: number;
}
export declare class TenderError extends Error {
}
export declare function allocateTenders(tenders: TenderInput[], grandTotal: number): TenderSplit;
