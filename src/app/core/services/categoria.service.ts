import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Categoria } from '../models/gasto.models';

@Injectable({ providedIn: 'root' })
export class CategoriaService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${environment.apiUrl}/categorias`;

    listar(): Observable<Categoria[]> {
        return this.http.get<Categoria[]>(this.baseUrl);
    }
}