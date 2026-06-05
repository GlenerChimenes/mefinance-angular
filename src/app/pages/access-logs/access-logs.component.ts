import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AccessLog } from '../../core/models/access-log.models';
import { AccessLogService } from '../../core/services/access-log.service';

@Component({
    selector: 'app-access-logs',
    standalone: true,
    imports: [DatePipe],
    template: `
    <section class="container page-head">
      <div>
        <span class="eyebrow">Administração</span>
        <h1>Últimos acessos</h1>
        <p>Visualize os últimos acessos dos usuários ao sistema.</p>
      </div>

      <button class="btn btn-primary" (click)="carregar()">
        Atualizar
      </button>
    </section>

    <section class="container">
      <article class="card table-card">
        <div class="toolbar">
          <div>
            <h2>Acessos recentes</h2>
            <small>{{ total() }} registro(s)</small>
          </div>
        </div>

        @if (loading()) {
          <div class="empty">Carregando acessos...</div>
        } @else if (logs().length === 0) {
          <div class="empty">Nenhum acesso encontrado.</div>
        } @else {
          <div class="table">
            <div class="row header">
              <span>Usuário</span>
              <span>E-mail</span>
              <span>Data/Hora</span>
              <span>IP</span>
              <span>Navegador</span>
            </div>

            @for (log of logs(); track $index) {
              <div class="row">
                <span>
                  <strong>{{ log.nome || 'Sem nome' }}</strong>
                  <small>ID #{{ log.id }}</small>
                </span>

                <span>{{ log.email }}</span>

                <span>{{ formatarDataHora(log.dataAcesso) }}</span>

                <span>{{ log.ip || '-' }}</span>

                <span class="user-agent">{{ simplificarUserAgent(log.userAgent) }}</span>
              </div>
            }
          </div>
        }
      </article>
    </section>
  `,
    styles: [`
    .page-head {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 20px;
      margin-bottom: 24px;
    }

    .eyebrow {
      text-transform: uppercase;
      letter-spacing: .14em;
      color: #2563eb;
      font-weight: 900;
      font-size: 12px;
    }

    h1 {
      font-size: 42px;
      margin: 8px 0 6px;
    }

    p {
      margin: 0;
      color: var(--muted);
    }

    .table-card {
      padding: 24px;
    }

    .toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 18px;
    }

    .toolbar h2 {
      margin: 0;
    }

    .toolbar small {
      color: var(--muted);
    }

    .table {
      width: 100%;
      display: block;
      overflow-x: auto;
    }

    .row {
      display: grid;
      grid-template-columns: minmax(180px, 1.2fr) minmax(220px, 1.3fr) 160px 130px minmax(220px, 1.4fr);
      gap: 14px;
      align-items: center;
      padding: 14px 0;
      border-bottom: 1px solid var(--border);
      min-width: 980px;
    }

    .row.header {
      color: var(--muted);
      font-size: 12px;
      font-weight: 900;
      text-transform: uppercase;
    }

    .row strong {
      display: block;
    }

    .row small {
      display: block;
      color: var(--muted);
      margin-top: 4px;
    }

    .user-agent {
      color: #475569;
      font-size: 13px;
      line-height: 1.4;
    }

    @media (max-width: 800px) {
      .page-head {
        display: block;
      }

      .page-head .btn {
        margin-top: 16px;
      }

      h1 {
        font-size: 34px;
      }
    }
  `]
})
export class AccessLogsComponent implements OnInit {
    private readonly service = inject(AccessLogService);

    loading = signal(false);
    logs = signal<AccessLog[]>([]);
    total = signal(0);

    ngOnInit(): void {
        this.carregar();
    }

    carregar(): void {
        this.loading.set(true);

        this.service.listar(0, 30).subscribe({
            next: page => {
                this.logs.set(page.content ?? []);
                this.total.set(page.totalElements ?? 0);
            },
            error: error => {
                console.error('Erro ao carregar acessos:', error);
                this.logs.set([]);
                this.total.set(0);
            },
            complete: () => this.loading.set(false)
        });
    }

    formatarDataHora(data?: string): string {
        if (!data) {
            return '-';
        }

        if (data.includes('/')) {
            return data;
        }

        const date = new Date(data);
        return new Intl.DateTimeFormat('pt-BR', {
            dateStyle: 'short',
            timeStyle: 'medium'
        }).format(date);
    }

    simplificarUserAgent(userAgent?: string): string {
        if (!userAgent) {
            return '-';
        }

        if (userAgent.includes('Chrome')) {
            return 'Chrome / Chromium';
        }

        if (userAgent.includes('Firefox')) {
            return 'Firefox';
        }

        if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
            return 'Safari';
        }

        if (userAgent.includes('Edg')) {
            return 'Microsoft Edge';
        }

        return userAgent.slice(0, 80);
    }
}