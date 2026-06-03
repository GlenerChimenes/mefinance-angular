import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserCreateRequest, UserResponse } from '../models/user.models';

@Injectable({ providedIn: 'root' })
export class UserService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${environment.apiUrl}/usuarios`;

    cadastrar(payload: UserCreateRequest): Observable<UserResponse> {
        return this.http.post<UserResponse>(this.baseUrl, payload);
    }
}