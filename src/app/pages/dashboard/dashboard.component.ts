import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Gasto, ResumoGastos } from '../../core/models/gasto.models';
import { GastoService } from '../../core/services/gasto.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, RouterLink],
  template: `
    <section class="container page-head">
        @if (todosPagos()) {
            <section class="container paid-alert">
                <div class="paid-alert-icon">✓</div>

                <div>
                    <strong>Todos os gastos do período {{ periodoFormatado() }} foram pagos.</strong>
                    <span>Parabéns! Não há despesas pendentes para este período.</span>
                </div>
            </section>
        }   
      <div><span class="eyebrow">Visão geral</span><h1>Dashboard financeiro</h1><p>Acompanhe seus gastos, pendências e despesas pagas.</p></div>
        <a class="btn btn-primary" routerLink="/gastos" [queryParams]="{ periodo: periodoAtual }">Novo gasto</a>
    </section>

    <section class="container grid-kpis">
        <article class="card kpi" [class.kpi-success]="todosPagos()">
            <span>Total</span>
            <strong>{{ total() | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</strong>
            <small>Soma de todos os gastos</small>
        </article>

        <article class="card kpi" [class.kpi-success]="todosPagos()">
            <span>Pago</span>
            <strong>{{ pago() | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</strong>
            <small>Despesas concluídas</small>
        </article>

        <article class="card kpi" [class.kpi-success]="todosPagos()">
            <span>Pendente</span>
            <strong>{{ pendente() | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</strong>
            <small>Valores em aberto</small>
        </article>

        <article class="card kpi" [class.kpi-success]="todosPagos()">
            <span>Sobra</span>
            <strong>{{ sobra() | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</strong>
            <small>Renda mensal menos gastos</small>
        </article>

        <article class="card kpi" [class.kpi-success]="todosPagos()">
            <span>Registros</span>
            <strong>{{ quantidade() }}</strong>
            <small>Gastos cadastrados</small>
        </article>
    </section>

    <section class="container content-grid">
      <article class="card chart-card">
        <div class="card-title"><h2>Distribuição</h2><span>{{ porcentagemPaga() }}% pago</span></div>
        <div class="bar"><i [style.width.%]="porcentagemPaga()"></i></div>
        <div class="legend"><span><b class="paid"></b> Pago</span><span><b class="pending"></b> Pendente</span></div>
      </article>
    
      <article class="card list-card">
        <div class="card-title"><h2>Últimos gastos</h2><a routerLink="/gastos" [queryParams]="{ periodo: periodoAtual }">Ver todos</a></div>
        @if (loading()) { <div class="empty">Carregando...</div> }
        @else if (ultimos().length === 0) { <div class="empty">Nenhum gasto encontrado.</div> }
        @else {
            @for (gasto of ultimos(); track $index) {
                <div class="expense">
                    <div>
                        <strong>{{ gasto.descricao }}</strong>
                        <small>{{ gasto.dataVencimento | date:'dd/MM/yyyy' }}</small>
                    </div>
                    <span>{{ gasto.valor | currency:'BRL' }}</span>
                </div>
            }
        }
      </article>
    </section>
  `,
  styles: [`
    .page-head{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin-bottom:24px}.eyebrow{text-transform:uppercase;letter-spacing:.14em;color:#2563eb;font-weight:900;font-size:12px}h1{font-size:42px;margin:8px 0 6px}p{margin:0;color:var(--muted)}.grid-kpis{display:grid;grid-template-columns:repeat(5,1fr);gap:18px}.kpi{padding:22px}.kpi span{font-size:13px;color:var(--muted);font-weight:800;text-transform:uppercase}.kpi strong{display:block;font-size:28px;margin:12px 0}.kpi small{color:var(--muted)}.content-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:18px}.chart-card,.list-card{padding:24px}.card-title{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:20px}.card-title h2{margin:0}.card-title span,.card-title a{color:#2563eb;font-weight:800}.bar{height:18px;background:#fde68a;border-radius:999px;overflow:hidden}.bar i{display:block;height:100%;background:linear-gradient(135deg,#16a34a,#22c55e);border-radius:999px}.legend{display:flex;gap:18px;margin-top:18px;color:var(--muted);font-weight:700}.legend b{display:inline-block;width:10px;height:10px;border-radius:999px;margin-right:6px}.paid{background:#16a34a}.pending{background:#f59e0b}.expense{display:flex;align-items:center;justify-content:space-between;padding:14px 0;border-bottom:1px solid var(--border)}.expense:last-child{border-bottom:0}.expense small{display:block;color:var(--muted);margin-top:4px}.expense span{font-weight:900}@media(max-width:980px){.grid-kpis,.content-grid{grid-template-columns:1fr 1fr}}@media(max-width:640px){.page-head{display:block}.grid-kpis,.content-grid{grid-template-columns:1fr}h1{font-size:34px}}
    .paid-alert {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 18px;
      padding: 18px 20px;
      border-radius: 24px;
      background: linear-gradient(135deg, #dcfce7, #f0fdf4);
      border: 1px solid #bbf7d0;
      box-shadow: 0 18px 40px rgba(22, 163, 74, .12);
      color: #14532d;
    }

    .paid-alert-icon {
      width: 46px;
      height: 46px;
      border-radius: 16px;
      background: linear-gradient(135deg, #16a34a, #22c55e);
      color: white;
      display: grid;
      place-items: center;
      font-size: 24px;
      font-weight: 900;
      flex: 0 0 auto;
    }

    .paid-alert strong {
      display: block;
      font-size: 17px;
      margin-bottom: 4px;
    }

    .paid-alert span {
      display: block;
      color: #166534;
      font-weight: 600;
    }

    .kpi-success {
      background: linear-gradient(135deg, #f0fdf4, #ffffff);
      border: 1px solid #bbf7d0;
      box-shadow: 0 18px 45px rgba(22, 163, 74, .12);
    }

    .kpi-success span {
      color: #15803d;
    }

    .kpi-success strong {
      color: #14532d;
    }

    .kpi-success small {
      color: #166534;
    }
  `]
})
export class DashboardComponent implements OnInit {
    private readonly gastoService = inject(GastoService);

    loading = signal(true);
    resumo = signal<ResumoGastos>({});
    ultimos = signal<Gasto[]>([]);

    periodoAtual = this.getPeriodoAtual();

    gastosResumo = computed(() => {
        const resumo: any = this.resumo();

        return resumo.gastosDTO
            ?? resumo.gastos
            ?? resumo.listaGastos
            ?? [];
    });

    total = computed(() => {
        const resumo: any = this.resumo();

        return resumo.totalGastos
            ?? resumo.total
            ?? this.gastosResumo().reduce((acc: number, g: Gasto) => acc + Number(g.valor || 0), 0);
    });

    formatarPeriodo(periodo?: number): string {
        if (!periodo) {
            return '-';
        }

        const periodoTexto = String(periodo).padStart(6, '0');
        const ano = periodoTexto.slice(0, 4);
        const mes = periodoTexto.slice(4, 6);

        return `${mes}/${ano}`;
    }

    pago = computed(() => {
        const resumo: any = this.resumo();

        return resumo.totalPago
            ?? this.gastosResumo()
                .filter((g: Gasto) => g.situacao === 'PAGO')
                .reduce((acc: number, g: Gasto) => acc + Number(g.valor || 0), 0);
    });

    todosPagos = computed(() =>
        this.quantidade() > 0 && this.pendente() === 0
    );

    periodoFormatado = computed(() => this.formatarPeriodo(this.periodoAtual));

    pendente = computed(() => {
        const resumo: any = this.resumo();

        return resumo.totalPendente
            ?? this.gastosResumo()
                .filter((g: Gasto) => g.situacao === 'PENDENTE')
                .reduce((acc: number, g: Gasto) => acc + Number(g.valor || 0), 0);
    });

    sobra = computed(() => {
        const resumo: any = this.resumo();

        return resumo.sobraNoMes
            ?? resumo.sobra
            ?? resumo.saldo
            ?? Math.max((resumo.rendaMensal ?? 0) - this.total(), 0);
    });

    quantidade = computed(() => {
        const resumo: any = this.resumo();

        return resumo.quantidade
            ?? this.gastosResumo().length;
    });

    porcentagemPaga = computed(() =>
        this.total() > 0 ? Math.round((this.pago() / this.total()) * 100) : 0
    );

    ngOnInit(): void {
        this.carregar();
    }

    carregar(): void {
        this.loading.set(true);

        this.gastoService.resumo().subscribe({
            next: resumo => {
                this.resumo.set(resumo);

                const resumoAny: any = resumo;
                const gastos = resumoAny.gastosDTO
                    ?? resumoAny.gastos
                    ?? resumoAny.listaGastos
                    ?? [];

                this.ultimos.set(gastos.slice(0, 6));
            },
            error: error => {
                console.error('Erro ao carregar resumo:', error);
                this.resumo.set({});
                this.ultimos.set([]);
            },
            complete: () => this.loading.set(false)
        });
    }

    private getPeriodoAtual(): number {
        const hoje = new Date();
        const ano = hoje.getFullYear();
        const mes = String(hoje.getMonth() + 1).padStart(2, '0');

        return Number(`${ano}${mes}`);
    }
}
