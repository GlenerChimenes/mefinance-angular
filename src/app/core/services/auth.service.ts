import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, TokenResponse } from '../models/auth.models';
import { TokenService } from './token.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenService = inject(TokenService);

  login(credentials: LoginRequest): Observable<TokenResponse> {
    const basic = btoa(`${environment.oauthClientId}:${environment.oauthClientSecret}`);
    const body = new HttpParams()
      .set('grant_type', 'password')
      .set('username', credentials.username)
      .set('password', credentials.password);

    return this.http.post<TokenResponse>(`${environment.apiUrl}${environment.oauthTokenPath}`, body, {
      headers: new HttpHeaders({
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      })
    }).pipe(tap(token => this.tokenService.save(token.access_token, token.refresh_token)));
  }

  logout(): void { this.tokenService.clear(); }
}
