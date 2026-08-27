import { ExceptionFilter, ArgumentsHost } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../logger/logger.service';
export declare class GlobalExceptionFilter implements ExceptionFilter {
    private readonly configService;
    private readonly loggerService;
    constructor(configService: ConfigService, loggerService: LoggerService);
    catch(exception: unknown, host: ArgumentsHost): void;
}
