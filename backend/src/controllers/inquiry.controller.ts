import { NextFunction, Request, Response } from 'express';
import { HTTP_STATUS } from '../constants/domain.constants.js';
import { AuthenticatedUserDto } from '../domain/entities/user.entity.js';
import { UnauthorizedError } from '../domain/errors/app-error.js';
import { IInquiryService } from '../services/inquiry.service.js';
import {
  CreateInquiryBodyDto,
  InquiryIdParamDto,
  ListInquiriesQueryDto,
  UpdateInquiryStatusBodyDto,
} from '../validators/inquiry.validator.js';

/**
 * HTTP Controller responsible solely for Customer Inquiry endpoints (Single Responsibility).
 */
export class InquiryController {
  private readonly inquiryService: IInquiryService;

  /**
   * Initializes InquiryController with an injected IInquiryService.
   *
   * @param inquiryService - Customer inquiry business service.
   */
  constructor(inquiryService: IInquiryService) {
    this.inquiryService = inquiryService;
  }

  /**
   * Extracts the verified AuthenticatedUserDto from the request or throws UnauthorizedError.
   *
   * @param req - Incoming Express Request.
   * @returns Verified AuthenticatedUserDto.
   * @throws UnauthorizedError if req.user is missing.
   */
  private requireActor(req: Request): AuthenticatedUserDto {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    return req.user;
  }

  /**
   * Handles POST /api/v1/inquiries to record a new customer inquiry.
   *
   * @param req - Express Request with validated CreateInquiryBodyDto.
   * @param res - Express Response returning 201 Created and InquiryDto.
   * @param next - Express NextFunction.
   */
  public createInquiry = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const actor = this.requireActor(req);
      const body = req.body as CreateInquiryBodyDto;

      const inquiry = await this.inquiryService.createInquiry(actor, {
        customerName: body.customerName,
        contactInfo: body.contactInfo,
        subject: body.subject,
        description: body.description,
      });

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        data: { inquiry },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handles GET /api/v1/inquiries to list and filter inquiries visible to the signed-in staff member.
   *
   * @param req - Express Request with validated ListInquiriesQueryDto.
   * @param res - Express Response returning paginated inquiries.
   * @param next - Express NextFunction.
   */
  public listInquiries = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const actor = this.requireActor(req);
      const query = req.query as unknown as ListInquiriesQueryDto;

      const result = await this.inquiryService.listInquiries(actor, {
        status: query.status,
        search: query.search,
        page: query.page,
        pageSize: query.pageSize,
      });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handles GET /api/v1/inquiries/:id to retrieve a single inquiry after verifying ownership/role.
   *
   * @param req - Express Request with validated InquiryIdParamDto.
   * @param res - Express Response returning InquiryDto.
   * @param next - Express NextFunction.
   */
  public getInquiryById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const actor = this.requireActor(req);
      const params = req.params as unknown as InquiryIdParamDto;

      const inquiry = await this.inquiryService.getInquiryById(actor, params.id);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: { inquiry },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handles PATCH /api/v1/inquiries/:id/status to move an inquiry through its lifecycle.
   *
   * @param req - Express Request with validated InquiryIdParamDto and UpdateInquiryStatusBodyDto.
   * @param res - Express Response returning updated InquiryDto.
   * @param next - Express NextFunction.
   */
  public updateInquiryStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const actor = this.requireActor(req);
      const params = req.params as unknown as InquiryIdParamDto;
      const body = req.body as UpdateInquiryStatusBodyDto;

      const inquiry = await this.inquiryService.transitionInquiryStatus(actor, {
        inquiryId: params.id,
        status: body.status,
        expectedVersion: body.expectedVersion,
        resolutionNote: body.resolutionNote,
      });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: { inquiry },
      });
    } catch (error) {
      next(error);
    }
  };
}

