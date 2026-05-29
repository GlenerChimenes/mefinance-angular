import { Injectable } from '@angular/core';

const ACCESS_TOKEN = 'mefinance.access_token';
const REFRESH_TOKEN = 'mefinance.refresh_token';

@Injectable({ providedIn: 'root' })
export class TokenService {

    get accessToken(): string | null {
        return localStorage.getItem(ACCESS_TOKEN);
    }

    get refreshToken(): string | null {
        return localStorage.getItem(REFRESH_TOKEN);
    }

    get isLoggedIn(): boolean {
        return !!this.accessToken;
    }

    save(accessToken: string, refreshToken?: string): void {
        localStorage.setItem(ACCESS_TOKEN, accessToken);

        if (refreshToken) {
            localStorage.setItem(REFRESH_TOKEN, refreshToken);
        }
    }

    clear(): void {
        localStorage.removeItem(ACCESS_TOKEN);
        localStorage.removeItem(REFRESH_TOKEN);
    }

    getPayload(): any | null {
        const token = this.accessToken;

        if (!token) {
            return null;
        }

        try {
            const payloadBase64 = token.split('.')[1];

            if (!payloadBase64) {
                return null;
            }

            const payloadJson = atob(payloadBase64);
            return JSON.parse(payloadJson);
        } catch (error) {
            console.error('Erro ao decodificar JWT', error);
            return null;
        }
    }

    getUserId(): number | null {
        const payload = this.getPayload();

        if (!payload) {
            return null;
        }

        const id =
            payload.userId ??
            payload.idUser ??
            payload.usuarioId ??
            payload.user_id ??
            payload.id;

        return id ? Number(id) : null;
    }

    getUsername(): string | null {
        const payload = this.getPayload();

        if (!payload) {
            return null;
        }

        return payload.username ?? payload.sub ?? null;
    }

    getAuthorities(): string[] {
        const payload = this.getPayload();

        if (!payload || !payload.authorities) {
            return [];
        }

        return payload.authorities;
    }
}