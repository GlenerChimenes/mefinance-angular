export interface UserCreateRequest {
    nome: string;
    email: string;
    password: string;
    rendaMensal: number;
}

export interface UserResponse {
    id: number;
    nome: string;
    email: string;
    rendaMensal: number;
}