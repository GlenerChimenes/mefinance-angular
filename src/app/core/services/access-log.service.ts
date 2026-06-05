import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AccessLog, Page } from '../models/access-log.models';

@Injectable({ providedIn: 'root' })
export class AccessLogService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${environment.apiUrl}/usuarios/acessos`;

    listar(page = 0, size = 20): Observable<Page<AccessLog>> {
        const params = new HttpParams()
            .set('page', page)
            .set('size', size);

        return this.http.get<Page<AccessLog>>(this.baseUrl, { params });
    }
}