export interface AccessLog {
    id: number;
    nome: string;
    email: string;
    dataAcesso: string;
    ip?: string;
    userAgent?: string;
}

export interface Page<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
}