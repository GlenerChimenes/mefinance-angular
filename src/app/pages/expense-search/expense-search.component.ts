    import { Component, OnInit, computed, inject, signal } from '@angular/core';
    import { CurrencyPipe, DatePipe } from '@angular/common';
    import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
    import { Gasto, ResumoGastos } from '../../core/models/gasto.models';
    import { GastoService } from '../../core/services/gasto.service';
    import { Router } from '@angular/router';
    
    @Component({
        selector: 'app-expense-search',
        standalone: true,
        imports: [ReactiveFormsModule, CurrencyPipe, DatePipe],
        template: `
        <section class="container page-head">
          <div>
            <span class="eyebrow">Consulta</span>
            <h1>Ver gastos</h1>
            <p>Pesquise seus gastos por mês e filtre os resultados encontrados.</p>
          </div>
        </section>
    
        <section class="container search-grid">
          <form class="card filter-card" [formGroup]="form" (ngSubmit)="pesquisar()">
            <h2>Pesquisar período</h2>
    
            @if (erro()) {
              <div class="error">{{ erro() }}</div>
            }
    
            <div class="field">
              <label>Mês</label>
              <input formControlName="mes" type="month">
    
              @if (form.controls.mes.touched && form.controls.mes.hasError('required')) {
                <small class="field-error">Informe o mês da pesquisa.</small>
              }
            </div>
    
            <div class="field">
              <label>Filtro</label>
              <input
                formControlName="termo"
                placeholder="Descrição, categoria ou situação..."
              >
            </div>
    
            <button
              type="submit"
              class="btn btn-primary"
              [disabled]="loading()"
            >
              {{ loading() ? 'Pesquisando...' : 'Pesquisar' }}
            </button>
          </form>
    
          <section class="results-area">
              @if (todosPagos()) {
                  <section class="paid-alert">
                      <div class="paid-alert-icon">✓</div>
    
                      <div>
                          <strong>Todos os gastos do {{ periodoFormatado() }} foram pagos.</strong>
                          <span>Não existem despesas pendentes nos resultados filtrados.</span>
                      </div>
                  </section>
              }    
            <section class="summary-grid">
              <article class="card kpi" [class.kpi-success]="todosPagos()">
                <span>Total filtrado</span>
                <strong>{{ totalFiltrado() | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</strong>
                <small>Soma dos gastos exibidos</small>
              </article>
    
              <article class="card kpi" [class.kpi-success]="todosPagos()">
                <span>Pago</span>
                <strong>{{ totalPago() | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</strong>
                <small>Despesas pagas</small>
              </article>
    
              <article class="card kpi" [class.kpi-success]="todosPagos()">
                <span>Pendente</span>
                <strong>{{ totalPendente() | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</strong>
                <small>Despesas em aberto</small>
              </article>
    
              <article class="card kpi" [class.kpi-success]="todosPagos()">
                  <span>Registros</span>
                  <strong>{{ gastosFiltrados().length }}</strong>
                  <small>Gastos encontrados</small>
              </article>
            </section>
    
            <article class="card table-card">
              <div class="toolbar">
                <div>
                  <h2>Gastos do período</h2>
                  <small>{{ periodoFormatado() }}</small>
                </div>
              </div>
    
              @if (loading()) {
                <div class="empty">Carregando gastos...</div>
              } @else if (pesquisou() && gastosFiltrados().length === 0) {
                <div class="empty">Nenhum gasto encontrado para esse período.</div>
              } @else if (!pesquisou()) {
                <div class="empty">Selecione um mês e clique em pesquisar.</div>
              } @else {
                <div class="table">
                  <div class="row header">
                    <span>Descrição</span>
                    <span>Categoria</span>
                    <span>Vencimento</span>
                    <span>Situação</span>
                    <span>Valor</span>
                    <span>Ações</span>
                  </div>

                    @for (gasto of gastosFiltrados(); track $index) {
                        <div
                                class="row"
                                [class.row-paid-flash]="foiPagoRecentemente(gasto)"
                        >
    <span>
      <strong>{{ gasto.descricao }}</strong>
      <small>Período {{ formatarPeriodo(gasto.periodo) }}</small>
    </span>

                            <span>{{ gasto.nomeCategoria || 'Sem categoria' }}</span>

                            <span>{{ formatarData(gasto.dataVencimento) }}</span>

                            <span>
      <b
              class="badge"
              [class.badge-ok]="gasto.situacao === 'PAGO'"
              [class.badge-warn]="gasto.situacao === 'PENDENTE'"
              [class.badge-danger]="gasto.situacao === 'CANCELADO'"
      >
        {{ gasto.situacao }}
      </b>
    </span>

                            <span class="money">
      {{ gasto.valor | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}
    </span>

                            <span class="row-actions">
      <button
              type="button"
              class="icon-btn icon-btn-edit"
              title="Editar"
              aria-label="Editar"
              (click)="editar(gasto)"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 20h4l10.8-10.8a2 2 0 0 0 0-2.8l-1.2-1.2a2 2 0 0 0-2.8 0L4 16v4Zm2-3.2 9.8-9.8 1.2 1.2L7.2 18H6v-1.2ZM14.8 6 16 4.8 17.2 6 16 7.2 14.8 6Z"/>
        </svg>

        <span class="tooltip">Editar</span>
      </button>

      <button
              type="button"
              class="icon-btn icon-btn-delete"
              title="Excluir"
              aria-label="Excluir"
              (click)="excluir(gasto)"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-2 6h10l-.7 10.2A2 2 0 0 1 14.3 21H9.7a2 2 0 0 1-2-1.8L7 9Zm3 2v7h2v-7h-2Zm4 0v7h2v-7h-2Z"/>
        </svg>

        <span class="tooltip">Excluir</span>
      </button>

                                @if (gasto.situacao !== 'PAGO') {
                                    <button
                                            type="button"
                                            class="icon-btn icon-btn-pay"
                                            [class.icon-btn-loading]="estaPagando(gasto)"
                                            [disabled]="estaPagando(gasto)"
                                            title="Marcar como pago"
                                            aria-label="Marcar como pago"
                                            (click)="pagar(gasto)"
                                    >
          @if (estaPagando(gasto)) {
              <span class="spinner"></span>
          } @else {
              <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9.2 16.6 4.9 12.3 3.5 13.7 9.2 19.4 21 7.6 19.6 6.2 9.2 16.6Z"/>
            </svg>
          }

                                        <span class="tooltip">Pagar</span>
        </button>
                                }
    </span>
                        </div>
                    }
                </div>
              }
            </article>
          </section>
        </section>
      `,
        styles: [`
          .paid-alert {
            display: flex;
            align-items: center;
            gap: 14px;
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
        .page-head {
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
    
        .search-grid {
          display: grid;
          grid-template-columns: 360px minmax(0, 1fr);
          gap: 18px;
          align-items: start;
        }
    
        .filter-card {
          padding: 24px;
          display: grid;
          gap: 16px;
        }
    
        .filter-card h2 {
          margin: 0;
        }
    
        .filter-card button {
          justify-content: center;
        }
    
        .results-area {
          display: grid;
          gap: 18px;
        }
    
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 18px;
        }
    
        .kpi {
          padding: 22px;
        }
    
        .kpi span {
          font-size: 13px;
          color: var(--muted);
          font-weight: 800;
          text-transform: uppercase;
        }
    
        .kpi strong {
          display: block;
          font-size: 26px;
          margin: 12px 0;
        }
    
        .kpi small {
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
            grid-template-columns: minmax(200px, 1.4fr) 150px 120px 120px 120px 150px;
            gap: 14px;
            align-items: center;
            padding: 14px 0;
            border-bottom: 1px solid var(--border);
            min-width: 900px;
          }
          .row-paid-flash {
            background: linear-gradient(90deg, rgba(220, 252, 231, .9), rgba(255, 255, 255, 0));
            box-shadow: inset 4px 0 0 #22c55e;
          }

          .row-actions {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .icon-btn {
            position: relative;
            width: 36px;
            height: 36px;
            border: 0;
            border-radius: 13px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: transform .16s ease, box-shadow .16s ease, background .16s ease, opacity .16s ease;
            box-shadow: 0 8px 18px rgba(15, 23, 42, .08);
          }

          .icon-btn:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 12px 24px rgba(15, 23, 42, .14);
          }

          .icon-btn:active:not(:disabled) {
            transform: translateY(0) scale(.96);
          }

          .icon-btn:disabled {
            opacity: .75;
            cursor: not-allowed;
          }

          .icon-btn svg {
            width: 18px;
            height: 18px;
            fill: currentColor;
          }

          .icon-btn-edit {
            background: #eef2ff;
            color: #4338ca;
          }

          .icon-btn-edit:hover:not(:disabled) {
            background: #e0e7ff;
          }

          .icon-btn-delete {
            background: #fee2e2;
            color: #b91c1c;
          }

          .icon-btn-delete:hover:not(:disabled) {
            background: #fecaca;
          }

          .icon-btn-pay {
            background: #dcfce7;
            color: #15803d;
          }

          .icon-btn-pay:hover:not(:disabled) {
            background: #bbf7d0;
          }

          .icon-btn-loading {
            background: #f0fdf4;
            color: #16a34a;
          }

          .tooltip {
            position: absolute;
            bottom: calc(100% + 8px);
            left: 50%;
            transform: translateX(-50%) translateY(4px);
            background: #0f172a;
            color: white;
            font-size: 12px;
            font-weight: 800;
            padding: 6px 8px;
            border-radius: 8px;
            opacity: 0;
            pointer-events: none;
            white-space: nowrap;
            transition: opacity .16s ease, transform .16s ease;
            z-index: 5;
          }

          .tooltip::after {
            content: "";
            position: absolute;
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            border-width: 5px;
            border-style: solid;
            border-color: #0f172a transparent transparent transparent;
          }

          .icon-btn:hover .tooltip {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }

          .spinner {
            width: 16px;
            height: 16px;
            border: 2px solid rgba(22, 163, 74, .22);
            border-top-color: #16a34a;
            border-radius: 50%;
            animation: spin .75s linear infinite;
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
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
    
        .money {
          font-weight: 900;
          white-space: nowrap;
        }
    
        .badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 900;
          white-space: nowrap;
        }
    
        .badge-ok {
          background: #dcfce7;
          color: #166534;
        }
    
        .badge-warn {
          background: #fef3c7;
          color: #92400e;
        }
    
        .badge-danger {
          background: #fee2e2;
          color: #991b1b;
        }
    
        .field-error {
          display: block;
          margin-top: 6px;
          color: #dc2626;
          font-size: 12px;
          font-weight: 700;
        }
    
        @media (max-width: 1050px) {
          .search-grid {
            grid-template-columns: 1fr;
          }
    
          .summary-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
    
        @media (max-width: 640px) {
          .summary-grid {
            grid-template-columns: 1fr;
          }
    
          .row {
            grid-template-columns: 1fr;
            gap: 8px;
            min-width: 0;
          }
    
          .row.header {
            display: none;
          }
    
          h1 {
            font-size: 34px;
          }
        }
      `]
    })
    export class ExpenseSearchComponent implements OnInit {
        private readonly fb = inject(FormBuilder);
        private readonly gastoService = inject(GastoService);
        private readonly router = inject(Router);
    
        loading = signal(false);
        erro = signal('');
        pesquisou = signal(false);
        gastos = signal<Gasto[]>([]);
        periodoPesquisado = signal<number | null>(null);
    
        form = this.fb.nonNullable.group({
            mes: [this.getMesAtualInput(), Validators.required],
            termo: ['']
        });
    
        gastosFiltrados = computed(() => {
            const termo = this.form.controls.termo.value.toLowerCase().trim();
    
            if (!termo) {
                return this.gastos();
            }
    
            return this.gastos().filter(gasto =>
                `${gasto.descricao ?? ''} ${gasto.nomeCategoria ?? ''} ${gasto.situacao ?? ''}`
                    .toLowerCase()
                    .includes(termo)
            );
        });
    
        idsPagando = signal<number[]>([]);
        idsPagosRecentemente = signal<number[]>([]);
    
        todosPagos = computed(() =>
            this.gastosFiltrados().length > 0 && this.totalPendente() === 0
        );
    
        totalFiltrado = computed(() =>
            this.gastosFiltrados()
                .reduce((acc, gasto) => acc + Number(gasto.valor || 0), 0)
        );
    
        totalPago = computed(() =>
            this.gastosFiltrados()
                .filter(gasto => gasto.situacao === 'PAGO')
                .reduce((acc, gasto) => acc + Number(gasto.valor || 0), 0)
        );
    
        totalPendente = computed(() =>
            this.gastosFiltrados()
                .filter(gasto => gasto.situacao === 'PENDENTE')
                .reduce((acc, gasto) => acc + Number(gasto.valor || 0), 0)
        );
    
        periodoFormatado = computed(() => {
            const periodo = this.periodoPesquisado();
    
            return periodo ? `Período ${this.formatarPeriodo(periodo)}` : 'Nenhum período pesquisado';
        });
    
        ngOnInit(): void {
            this.pesquisar();
        }
    
        pesquisar(): void {
            if (this.form.invalid) {
                this.form.markAllAsTouched();
                return;
            }
    
            this.loading.set(true);
            this.erro.set('');
            this.pesquisou.set(true);
    
            const periodo = this.converterMesParaPeriodo(this.form.controls.mes.value);
            this.periodoPesquisado.set(periodo);
    
            this.gastoService.resumoPorPeriodo(periodo).subscribe({
                next: resumo => {
                    const gastos = this.extrairGastosResumo(resumo);
                    this.gastos.set(gastos);
                },
                error: error => {
                    console.error('Erro ao pesquisar gastos:', error);
                    this.gastos.set([]);
                    this.erro.set('Não foi possível pesquisar os gastos desse período.');
                },
                complete: () => this.loading.set(false)
            });
        }
    
        private extrairGastosResumo(resumo: ResumoGastos): Gasto[] {
            const resumoAny = resumo as any;
    
            return resumoAny.gastosDTO
                ?? resumoAny.gastos
                ?? resumoAny.listaGastos
                ?? [];
        }
    
        formatarData(data?: string): string {
            if (!data) {
                return '-';
            }
    
            // Se já veio no formato dd/MM/yyyy, retorna como está
            if (data.includes('/')) {
                return data;
            }
    
            // Se veio no formato yyyy-MM-dd, converte para dd/MM/yyyy
            const [ano, mes, dia] = data.slice(0, 10).split('-');
    
            return `${dia}/${mes}/${ano}`;
        }
    
        private getMesAtualInput(): string {
            const hoje = new Date();
            const ano = hoje.getFullYear();
            const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    
            return `${ano}-${mes}`;
        }
    
        private converterMesParaPeriodo(mesInput: string): number {
            const [ano, mes] = mesInput.split('-');
    
            return Number(`${ano}${mes}`);
        }
    
        editar(gasto: Gasto): void {
            if (!gasto.id) {
                return;
            }
    
            this.router.navigate(['/gastos'], {
                queryParams: {
                    periodo: gasto.periodo
                },
                state: {
                    gastoEditar: gasto
                }
            });
        }
    
        excluir(gasto: Gasto): void {
            if (!gasto.id || !confirm(`Excluir o gasto "${gasto.descricao}"?`)) {
                return;
            }
    
            const listaAnterior = [...this.gastos()];
    
            this.gastos.set(this.gastos().filter(item => item.id !== gasto.id));
    
            this.gastoService.excluir(gasto.id).subscribe({
                error: error => {
                    console.error('Erro ao excluir gasto:', error);
                    this.gastos.set(listaAnterior);
                    this.erro.set('Não foi possível excluir o gasto.');
                }
            });
        }
    
        pagar(gasto: Gasto): void {
            if (!gasto.id || gasto.situacao === 'PAGO' || this.estaPagando(gasto)) {
                return;
            }
    
            const listaAnterior = [...this.gastos()];
            const id = gasto.id;
    
            this.idsPagando.set([...this.idsPagando(), id]);
            this.erro.set('');
    
            this.gastos.set(
                this.gastos().map(item =>
                    item.id === id
                        ? {
                            ...item,
                            situacao: 'PAGO',
                            dataPagamento: new Date().toISOString()
                        }
                        : item
                )
            );
    
            this.gastoService.pagarGasto(id).subscribe({
                next: gastoAtualizado => {
                    this.gastos.set(
                        this.gastos().map(item =>
                            item.id === id
                                ? {
                                    ...item,
                                    ...gastoAtualizado,
                                    situacao: gastoAtualizado?.situacao ?? 'PAGO'
                                }
                                : item
                        )
                    );
    
                    this.marcarComoPagoRecentemente(id);
                },
                error: error => {
                    console.error('Erro ao pagar gasto:', error);
                    this.gastos.set(listaAnterior);
                    this.erro.set('Não foi possível marcar o gasto como pago.');
                },
                complete: () => {
                    this.idsPagando.set(this.idsPagando().filter(itemId => itemId !== id));
                }
            });
        }
    
        estaPagando(gasto: Gasto): boolean {
            return !!gasto.id && this.idsPagando().includes(gasto.id);
        }
    
        foiPagoRecentemente(gasto: Gasto): boolean {
            return !!gasto.id && this.idsPagosRecentemente().includes(gasto.id);
        }
    
        private marcarComoPagoRecentemente(id: number): void {
            this.idsPagosRecentemente.set([...this.idsPagosRecentemente(), id]);
    
            setTimeout(() => {
                this.idsPagosRecentemente.set(
                    this.idsPagosRecentemente().filter(itemId => itemId !== id)
                );
            }, 1800);
        }
    
        formatarPeriodo(periodo?: number): string {
            if (!periodo) {
                return '-';
            }
    
            const periodoTexto = String(periodo).padStart(6, '0');
            const ano = periodoTexto.slice(0, 4);
            const mes = periodoTexto.slice(4, 6);
    
            return `${mes}/${ano}`;
        }
    }