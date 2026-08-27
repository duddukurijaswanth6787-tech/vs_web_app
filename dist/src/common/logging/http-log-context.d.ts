export declare const HTTP_LOG_CONTEXT_SYMBOL: unique symbol;
export interface HttpLoggingContext {
    requestId: string;
    startTime: bigint;
    controller?: string;
    handler?: string;
    incomingLogged: boolean;
    errorLogged: boolean;
}
