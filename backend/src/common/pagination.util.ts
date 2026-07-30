export interface PaginationParams {
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export function parsePaginationParams(params?: PaginationParams) {
    const rawPage = params?.page ? Number(params.page) : 1;
    const rawPageSize = params?.pageSize ? Number(params.pageSize) : 50;

    const page = isNaN(rawPage) || rawPage < 1 ? 1 : Math.floor(rawPage);
    let pageSize = isNaN(rawPageSize) || rawPageSize < 1 ? 50 : Math.floor(rawPageSize);
    if (pageSize > 200) pageSize = 200;

    const skip = (page - 1) * pageSize;
    const take = pageSize;

    return {
        page,
        pageSize,
        skip,
        take,
        sortBy: params?.sortBy,
        sortDir: params?.sortDir || 'desc'
    };
}

export function buildPaginatedResponse<T>(items: T[], total: number, page: number, pageSize: number): PaginatedResult<T> {
    const safePageSize = pageSize || 50;
    const totalPages = Math.ceil(total / safePageSize) || (total > 0 ? 1 : 0);
    return {
        items,
        total,
        page,
        pageSize: safePageSize,
        totalPages
    };
}
