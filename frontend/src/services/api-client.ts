import {
  ApiErrorDetails,
  ApiErrorEnvelope,
  ApiSuccessEnvelope,
  AuthenticatedUser,
  CreateInquiryPayload,
  ERROR_CODE,
  ErrorCode,
  Inquiry,
  ListInquiriesParams,
  PaginatedInquiries,
  UpdateInquiryStatusPayload,
} from '@/types/inquiry.types';

/**
 * Structured frontend error representing a predictable backend API failure.
 */
export class ApiClientError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: ApiErrorDetails;
  public readonly correlationId?: string;

  /**
   * Constructs an ApiClientError from an HTTP status and API error envelope.
   *
   * @param message - Human-readable error message.
   * @param statusCode - HTTP response status code.
   * @param code - Machine-readable domain error code.
   * @param details - Optional structured error metadata.
   * @param correlationId - Optional server correlation ID for support debugging.
   */
  constructor(
    message: string,
    statusCode: number,
    code: ErrorCode,
    details?: ApiErrorDetails,
    correlationId?: string
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = 'ApiClientError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.correlationId = correlationId;
  }
}

/**
 * Contract for communicating with the Customer Inquiry Backend API (Dependency Inversion).
 */
export interface IApiClient {
  login(email: string, password: string): Promise<AuthenticatedUser>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<AuthenticatedUser>;
  listInquiries(params?: ListInquiriesParams): Promise<PaginatedInquiries>;
  getInquiryById(id: string): Promise<Inquiry>;
  createInquiry(payload: CreateInquiryPayload): Promise<Inquiry>;
  updateInquiryStatus(id: string, payload: UpdateInquiryStatusPayload): Promise<Inquiry>;
}

const DEFAULT_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api/v1';

/**
 * Typed HTTP client encapsulating fetch calls, httpOnly cookie credentials, and error normalization.
 */
export class HttpApiClient implements IApiClient {
  private readonly baseUrl: string;

  /**
   * Initializes HttpApiClient with a target API base URL.
   *
   * @param baseUrl - Base URL of the Express API.
   */
  constructor(baseUrl: string = DEFAULT_API_BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  /**
   * Executes an HTTP request with credentials included and parses the typed JSON envelope.
   *
   * @param path - Endpoint path relative to baseUrl.
   * @param options - Fetch RequestInit configuration.
   * @returns Unwrapped data payload from ApiSuccessEnvelope.
   * @throws ApiClientError when the response status is non-2xx or network fails.
   */
  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    let response: Response;

    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        ...options,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers ?? {}),
        },
      });
    } catch {
      throw new ApiClientError(
        'Unable to reach the server. Please check your connection and ensure the backend API is running.',
        0,
        ERROR_CODE.INTERNAL_ERROR
      );
    }

    let body: ApiSuccessEnvelope<T> | ApiErrorEnvelope | null = null;
    try {
      body = (await response.json()) as ApiSuccessEnvelope<T> | ApiErrorEnvelope;
    } catch {
      body = null;
    }

    if (!response.ok || !body || !body.success) {
      const errorPayload =
        body && !body.success
          ? body.error
          : {
              code: ERROR_CODE.INTERNAL_ERROR,
              message: `Request failed with status ${response.status}.`,
            };

      throw new ApiClientError(
        errorPayload.message,
        response.status,
        errorPayload.code,
        errorPayload.details,
        errorPayload.correlationId
      );
    }

    return body.data;
  }

  /**
   * Authenticates a staff member with email and password.
   *
   * @param email - Staff email address.
   * @param password - Staff password.
   * @returns AuthenticatedUser profile.
   */
  public async login(email: string, password: string): Promise<AuthenticatedUser> {
    const data = await this.request<{ user: AuthenticatedUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    return data.user;
  }

  /**
   * Signs out the current staff member and clears the session cookie.
   */
  public async logout(): Promise<void> {
    await this.request<{ message: string }>('/auth/logout', {
      method: 'POST',
    });
  }

  /**
   * Fetches the currently authenticated staff member's session profile.
   *
   * @returns AuthenticatedUser profile.
   */
  public async getCurrentUser(): Promise<AuthenticatedUser> {
    const data = await this.request<{ user: AuthenticatedUser }>('/auth/me', {
      method: 'GET',
    });
    return data.user;
  }

  /**
   * Retrieves a paginated list of customer inquiries matching optional filter and search criteria.
   *
   * @param params - Optional status, search query, page, and pageSize parameters.
   * @returns PaginatedInquiries response.
   */
  public async listInquiries(
    params: ListInquiriesParams = {}
  ): Promise<PaginatedInquiries> {
    const searchParams = new URLSearchParams();

    if (params.status) {
      searchParams.set('status', params.status);
    }
    if (params.search && params.search.trim().length > 0) {
      searchParams.set('search', params.search.trim());
    }
    if (params.page) {
      searchParams.set('page', String(params.page));
    }
    if (params.pageSize) {
      searchParams.set('pageSize', String(params.pageSize));
    }

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/inquiries?${queryString}` : '/inquiries';

    return this.request<PaginatedInquiries>(endpoint, {
      method: 'GET',
    });
  }

  /**
   * Retrieves a single inquiry by its UUID.
   *
   * @param id - Target inquiry UUID.
   * @returns Inquiry details.
   */
  public async getInquiryById(id: string): Promise<Inquiry> {
    const data = await this.request<{ inquiry: Inquiry }>(
      `/inquiries/${encodeURIComponent(id)}`,
      {
        method: 'GET',
      }
    );
    return data.inquiry;
  }

  /**
   * Records a new customer inquiry.
   *
   * @param payload - Customer name, contact info, subject, and description.
   * @returns Newly created Inquiry.
   */
  public async createInquiry(payload: CreateInquiryPayload): Promise<Inquiry> {
    const data = await this.request<{ inquiry: Inquiry }>('/inquiries', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return data.inquiry;
  }

  /**
   * Updates an inquiry's status with optimistic concurrency version verification.
   *
   * @param id - Target inquiry UUID.
   * @param payload - Next status, expectedVersion, and optional resolutionNote.
   * @returns Updated Inquiry.
   */
  public async updateInquiryStatus(
    id: string,
    payload: UpdateInquiryStatusPayload
  ): Promise<Inquiry> {
    const data = await this.request<{ inquiry: Inquiry }>(
      `/inquiries/${encodeURIComponent(id)}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }
    );
    return data.inquiry;
  }
}

export const apiClient: IApiClient = new HttpApiClient();

