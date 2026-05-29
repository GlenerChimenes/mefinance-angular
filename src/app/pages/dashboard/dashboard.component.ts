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
      <div><span class="eyebrow">Visão geral</span><h1>Dashboard financeiro</h1><p>Acompanhe seus gastos, pendências e despesas pagas.</p></div>
      <a class="btn btn-primary" routerLink="/gastos">Novo gasto</a>
    </section>

    <section class="container grid-kpis">
      <article class="card kpi"><span>Total</span><strong>{{ total() | currency:'BRL' }}</strong><small>Soma de todos os gastos</small></article>
      <article class="card kpi"><span>Pago</span><strong>{{ pago() | currency:'BRL' }}</strong><small>Despesas concluídas</small></article>
      <article class="card kpi"><span>Pendente</span><strong>{{ pendente() | currency:'BRL' }}</strong><small>Valores em aberto</small></article>
      <article class="card kpi"><span>Registros</span><strong>{{ quantidade() }}</strong><small>Gastos cadastrados</small></article>
    </section>

    <section class="container content-grid">
      <article class="card chart-card">
        <div class="card-title"><h2>Distribuição</h2><span>{{ porcentagemPaga() }}% pago</span></div>
        <div class="bar"><i [style.width.%]="porcentagemPaga()"></i></div>
        <div class="legend"><span><b class="paid"></b> Pago</span><span><b class="pending"></b> Pendente</span></div>
      </article>
    
      <article class="card list-card">
        <div class="card-title"><h2>Últimos gastos</h2><a routerLink="/gastos">Ver todos</a></div>
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
    .page-head{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin-bottom:24px}.eyebrow{text-transform:uppercase;letter-spacing:.14em;color:#2563eb;font-weight:900;font-size:12px}h1{font-size:42px;margin:8px 0 6px}p{margin:0;color:var(--muted)}.grid-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:18px}.kpi{padding:22px}.kpi span{font-size:13px;color:var(--muted);font-weight:800;text-transform:uppercase}.kpi strong{display:block;font-size:28px;margin:12px 0}.kpi small{color:var(--muted)}.content-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:18px}.chart-card,.list-card{padding:24px}.card-title{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:20px}.card-title h2{margin:0}.card-title span,.card-title a{color:#2563eb;font-weight:800}.bar{height:18px;background:#fde68a;border-radius:999px;overflow:hidden}.bar i{display:block;height:100%;background:linear-gradient(135deg,#16a34a,#22c55e);border-radius:999px}.legend{display:flex;gap:18px;margin-top:18px;color:var(--muted);font-weight:700}.legend b{display:inline-block;width:10px;height:10px;border-radius:999px;margin-right:6px}.paid{background:#16a34a}.pending{background:#f59e0b}.expense{display:flex;align-items:center;justify-content:space-between;padding:14px 0;border-bottom:1px solid var(--border)}.expense:last-child{border-bottom:0}.expense small{display:block;color:var(--muted);margin-top:4px}.expense span{font-weight:900}@media(max-width:980px){.grid-kpis,.content-grid{grid-template-columns:1fr 1fr}}@media(max-width:640px){.page-head{display:block}.grid-kpis,.content-grid{grid-template-columns:1fr}h1{font-size:34px}}
  `]
})
export class DashboardComponent implements OnInit {
  private readonly gastoService = inject(GastoService);
  loading = signal(true);
  resumo = signal<ResumoGastos>({});
  ultimos = signal<Gasto[]>([]);
  total = computed(() => this.resumo().total ?? this.ultimos().reduce((acc, g) => acc + Number(g.valor || 0), 0));
  pago = computed(() => this.resumo().totalPago ?? this.ultimos().filter(g => g.situacao === 'PAGO').reduce((acc, g) => acc + Number(g.valor || 0), 0));
  pendente = computed(() => this.resumo().totalPendente ?? Math.max(this.total() - this.pago(), 0));
  quantidade = computed(() => this.resumo().quantidade ?? this.ultimos().length);
  porcentagemPaga = computed(() => this.total() > 0 ? Math.round((this.pago() / this.total()) * 100) : 0);

  ngOnInit(): void { this.carregar(); }

  carregar(): void {
    this.gastoService.resumo().subscribe({ next: resumo => this.resumo.set(resumo), error: () => undefined });
    this.gastoService.listar(0, 6).subscribe({
      next: result => this.ultimos.set(Array.isArray(result) ? result.slice(0, 6) : result.content),
      error: () => this.ultimos.set([]),
      complete: () => this.loading.set(false)
    });
  }
}
