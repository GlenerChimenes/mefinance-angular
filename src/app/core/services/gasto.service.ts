import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Gasto, Page, ResumoGastos } from '../models/gasto.models';
import { TokenService } from './token.service';

@Injectable({ providedIn: 'root' })
export class GastoService {
    private readonly http = inject(HttpClient);
    private readonly tokenService = inject(TokenService);
    private readonly baseUrl = `${environment.apiUrl}/gastos`;

    private getUsuarioId(): number {
        const usuarioId = this.tokenService.getUserId();

        if (!usuarioId) {
            throw new Error('Usuário não encontrado no token JWT.');
        }

        return usuarioId;
    }

    private getPeriodoAtual(): number {
        const hoje = new Date();
        const ano = hoje.getFullYear();
        const mes = String(hoje.getMonth() + 1).padStart(2, '0');

        return Number(`${ano}${mes}`);
    }

    resumo(periodo?: number): Observable<ResumoGastos> {
        const params = new HttpParams()
            .set('usuarioId', this.getUsuarioId())
            .set('periodo', periodo ?? this.getPeriodoAtual());

        return this.http.get<ResumoGastos>(this.baseUrl, { params });
    }

    listar(page = 0, size = 20, termo = ''): Observable<Page<Gasto>> {
        const usuarioId = this.getUsuarioId();

        let params = new HttpParams()
            .set('usuarioId', usuarioId)
            .set('page', page)
            .set('size', size);

        if (termo.trim()) {
            params = params.set('descricao', termo.trim());

            return this.http.get<Page<Gasto>>(`${this.baseUrl}/filtrados`, { params });
        }

        return this.http.get<Page<Gasto>>(`${this.baseUrl}/todos`, { params });
    }

    criar(gasto: Gasto): Observable<Gasto> {
        return this.http.post<Gasto>(this.baseUrl, {
            ...gasto,
            idUser: this.getUsuarioId(),
            periodo: gasto.periodo ?? this.getPeriodoAtual()
        });
    }

    atualizar(id: number, gasto: Gasto): Observable<Gasto> {
        return this.http.put<Gasto>(`${this.baseUrl}/${id}`, {
            ...gasto,
            idUser: this.getUsuarioId(),
            periodo: gasto.periodo ?? this.getPeriodoAtual()
        });
    }

    excluir(id: number): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`);
    }

    pagarGasto(id: number): Observable<Gasto> {
        const params = new HttpParams()
            .set('userId', this.getUsuarioId());

        return this.http.get<Gasto>(`${this.baseUrl}/pagarGasto/${id}`, { params });
    }

    replicarGastos(periodoAtual: number, periodoReplicar: number): Observable<void> {
        const params = new HttpParams()
            .set('userId', this.getUsuarioId())
            .set('periodoAtual', periodoAtual)
            .set('periodoReplicar', periodoReplicar);

        return this.http.get<void>(`${this.baseUrl}/replicar`, { params });
    }
}