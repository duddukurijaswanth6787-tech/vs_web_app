import { CancellationService } from './cancellation.service';
import { CreateCancellationDto, UpdateCancellationDto } from './cancellation.types';
import type { JwtPayload } from "../auth/services/jwt.service";
export declare class CancellationController {
    private readonly cancelService;
    constructor(cancelService: CancellationService);
    findByOrderId(orderId: string): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./cancellation.types").CancellationResponse>>;
    create(dto: CreateCancellationDto, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./cancellation.types").CancellationResponse>>;
    update(id: string, dto: UpdateCancellationDto, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./cancellation.types").CancellationResponse>>;
}
