import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, forkJoin, of } from 'rxjs';

import { Gasto, ResumoGastos } from '../../core/models/gasto.models';
import { GastoService } from '../../core/services/gasto.service';

type CategoriaAnalise = {
    nome: string;
    valor: number;
    percentual: number;
    cor: string;
};

type MesAnalise = {
    periodo: number;
    label: string;
    valor: number;
    pago: number;
    pendente: number;
};

type PontoLinha = {
    x: number;
    y: number;
    label: string;
    valor: number;
};

type TooltipGrafico = {
    visivel: boolean;
    x: number;
    y: number;
    label: string;
    total: number;
    pago: number;
    pendente: number;
};

@Component({
    selector: 'app-expense-analysis',
    standalone: true,
    imports: [ReactiveFormsModule, CurrencyPipe, DecimalPipe],
    template: `
    <section class="container page-head">
      <div>
        <span class="eyebrow">Análise</span>
        <h1>Análise de gastos</h1>
        <p>Visualize a distribuição dos gastos por categoria e a evolução mês a mês.</p>
      </div>
    </section>

    <section class="container analysis-page">
      <section class="summary-grid">
        <article class="card kpi">
          <span>Total do mês</span>
          <strong>{{ totalMes() | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</strong>
          <small>{{ periodoSelecionadoFormatado() }}</small>
        </article>

        <article class="card kpi">
          <span>Maior categoria</span>
          <strong>{{ maiorCategoria()?.nome || '-' }}</strong>
          <small>
            {{ maiorCategoriaValor() | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}
          </small>
        </article>

        <article
          class="card kpi"
          [class.kpi-up]="variacaoValor() > 0"
          [class.kpi-down]="variacaoValor() < 0"
        >
          <span>Variação mensal</span>
          <strong>
            {{ variacaoPercentual() | number:'1.0-2':'pt-BR' }}%
          </strong>
          <small>{{ textoVariacao() }}</small>
        </article>
      </section>

      <article class="card chart-card line-card">
        <div class="card-title">
          <div>
            <h2>Evolução mensal</h2>
            <small>Pago, pendente e total comparados mês a mês</small>
          </div>
        </div>

        @if (loading()) {
          <div class="empty">Carregando histórico...</div>
        } @else if (historicoMensal().length === 0) {
          <div class="empty">Nenhum histórico encontrado.</div>
        } @else {
          <div class="combo-chart-wrap">
            <div
              class="combo-chart-box"
              (mouseleave)="esconderTooltipGrafico()"
            >
              <svg
                class="combo-chart"
                viewBox="0 0 720 300"
                preserveAspectRatio="none"
                role="img"
                aria-label="Gráfico combinado de evolução mensal de gastos"
              >
                <line x1="54" y1="248" x2="700" y2="248" class="axis"></line>
                <line x1="54" y1="30" x2="54" y2="248" class="axis"></line>

                <line x1="54" y1="204" x2="700" y2="204" class="grid-line"></line>
                <line x1="54" y1="160" x2="700" y2="160" class="grid-line"></line>
                <line x1="54" y1="116" x2="700" y2="116" class="grid-line"></line>
                <line x1="54" y1="72" x2="700" y2="72" class="grid-line"></line>
                <line x1="54" y1="30" x2="700" y2="30" class="grid-line"></line>

                <text x="10" y="252" class="axis-label">R$ 0</text>
                <text x="10" y="208" class="axis-label">{{ formatarValorEixo(getValorEixo(1)) }}</text>
                <text x="10" y="164" class="axis-label">{{ formatarValorEixo(getValorEixo(2)) }}</text>
                <text x="10" y="120" class="axis-label">{{ formatarValorEixo(getValorEixo(3)) }}</text>
                <text x="10" y="76" class="axis-label">{{ formatarValorEixo(getValorEixo(4)) }}</text>
                <text x="10" y="34" class="axis-label">{{ formatarValorEixo(getValorEixo(5)) }}</text>

                @for (mes of historicoMensal(); track mes.periodo; let i = $index) {
                  <rect
                    [attr.x]="getHoverAreaX(i)"
                    y="24"
                    [attr.width]="getHoverAreaWidth()"
                    height="245"
                    class="hover-area"
                    (mousemove)="mostrarTooltipGrafico($event, mes)"
                    (mouseenter)="mostrarTooltipGrafico($event, mes)"
                  ></rect>
                }

                @for (mes of historicoMensal(); track mes.periodo; let i = $index) {
                  <rect
                    [attr.x]="getBarX(i, 'pago')"
                    [attr.y]="getBarY(mes.pago)"
                    width="16"
                    [attr.height]="getBarHeight(mes.pago)"
                    rx="3"
                    class="bar-paid"
                  ></rect>

                  <rect
                    [attr.x]="getBarX(i, 'pendente')"
                    [attr.y]="getBarY(mes.pendente)"
                    width="16"
                    [attr.height]="getBarHeight(mes.pendente)"
                    rx="3"
                    class="bar-pending"
                  ></rect>

                  <text
                    [attr.x]="getLabelX(i)"
                    y="278"
                    text-anchor="middle"
                    class="month-label-svg"
                  >
                    {{ mes.label }}
                  </text>
                }

                <polyline
                  [attr.points]="linhaPontos()"
                  class="line-path"
                ></polyline>

                @for (ponto of pontosLinha(); track $index) {
                  <circle
                    [attr.cx]="ponto.x"
                    [attr.cy]="ponto.y"
                    r="4"
                    class="line-point"
                  ></circle>
                }
              </svg>

              @if (tooltipGrafico().visivel) {
                <div
                  class="chart-tooltip"
                  [style.left.px]="tooltipGrafico().x"
                  [style.top.px]="tooltipGrafico().y"
                >
                  <strong>{{ tooltipGrafico().label }}</strong>

                  <span>
                    Total:
                    <b>{{ tooltipGrafico().total | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</b>
                  </span>

                  <span>
                    Pago:
                    <b>{{ tooltipGrafico().pago | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</b>
                  </span>

                  <span>
                    Pendente:
                    <b>{{ tooltipGrafico().pendente | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</b>
                  </span>
                </div>
              }
            </div>

            <div class="chart-legend">
              <span><i class="legend-paid"></i> Pago</span>
              <span><i class="legend-pending"></i> Pendente</span>
              <span><i class="legend-total"></i> Total</span>
            </div>

            <div class="history-list">
              @for (mes of historicoMensal(); track mes.periodo) {
                <div>
                  <span>{{ mes.label }}</span>
                  <strong>{{ mes.valor | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</strong>
                </div>
              }
            </div>
          </div>
        }
      </article>

      <section class="bottom-grid">
        <form class="card filter-card" [formGroup]="form" (ngSubmit)="pesquisar()">
          <h2>Filtros</h2>

          @if (erro()) {
            <div class="error">{{ erro() }}</div>
          }

          <div class="field">
            <label>Mês de análise</label>
            <input formControlName="mes" type="month">

            @if (form.controls.mes.touched && form.controls.mes.hasError('required')) {
              <small class="field-error">Informe o mês para análise.</small>
            }
          </div>

          <div class="field">
            <label>Histórico</label>
            <select formControlName="quantidadeMeses">
              <option [ngValue]="3">Últimos 3 meses</option>
              <option [ngValue]="6">Últimos 6 meses</option>
              <option [ngValue]="12">Últimos 12 meses</option>
            </select>
          </div>

          <button
            type="submit"
            class="btn btn-primary"
            [disabled]="loading()"
          >
            {{ loading() ? 'Analisando...' : 'Analisar gastos' }}
          </button>
        </form>

        <article class="card chart-card pie-card">
          <div class="card-title">
            <div>
              <h2>Gastos por categoria</h2>
              <small>{{ periodoSelecionadoFormatado() }}</small>
            </div>
          </div>

          @if (loading()) {
            <div class="empty">Carregando gráfico...</div>
          } @else if (categoriasAnalise().length === 0) {
            <div class="empty">Nenhum gasto encontrado para o mês selecionado.</div>
          } @else {
            <div class="pie-area">
              <div
                class="pie-chart"
                [style.background]="pizzaGradient()"
              >
                <div class="pie-center">
                  <strong>{{ totalMes() | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</strong>
                  <small>Total</small>
                </div>
              </div>

              <div class="legend-list">
                @for (categoria of categoriasAnalise(); track categoria.nome) {
                  <div class="legend-item">
                    <span class="legend-dot" [style.background]="categoria.cor"></span>

                    <div>
                      <strong>{{ categoria.nome }}</strong>
                      <small>
                        {{ categoria.percentual | number:'1.0-1':'pt-BR' }}%
                        ·
                        {{ categoria.valor | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}
                      </small>
                    </div>
                  </div>
                }
              </div>
            </div>
          }
        </article>
      </section>
    </section>
  `,
    styles: [`
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

    .analysis-page {
      display: grid;
      gap: 18px;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
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

    .kpi-up {
      background: linear-gradient(135deg, #fef2f2, #ffffff);
      border: 1px solid #fecaca;
    }

    .kpi-up span,
    .kpi-up strong,
    .kpi-up small {
      color: #991b1b;
    }

    .kpi-down {
      background: linear-gradient(135deg, #f0fdf4, #ffffff);
      border: 1px solid #bbf7d0;
    }

    .kpi-down span,
    .kpi-down strong,
    .kpi-down small {
      color: #166534;
    }

    .bottom-grid {
      display: grid;
      grid-template-columns: 320px minmax(0, 1fr);
      gap: 18px;
      align-items: start;
    }

    .filter-card {
      padding: 22px;
      display: grid;
      gap: 14px;
      align-self: start;
    }

    .filter-card h2 {
      margin: 0;
      font-size: 24px;
    }

    .filter-card button {
      justify-content: center;
    }

    .chart-card {
      padding: 24px;
    }

    .line-card {
      min-height: 460px;
    }

    .pie-card {
      min-height: 360px;
    }

    .card-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 20px;
    }

    .card-title h2 {
      margin: 0;
    }

    .card-title small {
      color: var(--muted);
    }

    .combo-chart-wrap {
      display: grid;
      gap: 14px;
    }

    .combo-chart-box {
      position: relative;
    }

    .combo-chart {
      width: 100%;
      height: 340px;
      overflow: visible;
    }

    .axis {
      stroke: #cbd5e1;
      stroke-width: 1;
    }

    .grid-line {
      stroke: #e5e7eb;
      stroke-width: 1;
      stroke-dasharray: 4 6;
    }

    .axis-label {
      font-size: 11px;
      fill: #64748b;
      font-weight: 700;
    }

    .month-label-svg {
      font-size: 12px;
      fill: #64748b;
      font-weight: 900;
      text-transform: uppercase;
    }

    .hover-area {
      fill: transparent;
      cursor: pointer;
    }

    .hover-area:hover {
      fill: rgba(37, 99, 235, .04);
    }

    .bar-paid {
      fill: #0f4ea8;
    }

    .bar-pending {
      fill: #ef4444;
    }

    .line-path {
      fill: none;
      stroke: #2563eb;
      stroke-width: 3.5;
      stroke-linecap: round;
      stroke-linejoin: round;
      filter: drop-shadow(0 6px 8px rgba(37, 99, 235, .18));
    }

    .line-point {
      fill: #ffffff;
      stroke: #2563eb;
      stroke-width: 3;
    }

    .chart-tooltip {
      position: absolute;
      z-index: 20;
      min-width: 190px;
      padding: 12px 14px;
      border-radius: 16px;
      background: #0f172a;
      color: #ffffff;
      box-shadow: 0 18px 45px rgba(15, 23, 42, .28);
      pointer-events: none;
      transform: translateY(-100%);
    }

    .chart-tooltip::after {
      content: "";
      position: absolute;
      left: 16px;
      top: 100%;
      border-width: 7px;
      border-style: solid;
      border-color: #0f172a transparent transparent transparent;
    }

    .chart-tooltip strong {
      display: block;
      font-size: 14px;
      margin-bottom: 8px;
    }

    .chart-tooltip span {
      display: flex;
      justify-content: space-between;
      gap: 14px;
      font-size: 12px;
      color: #cbd5e1;
      margin-top: 4px;
    }

    .chart-tooltip b {
      color: #ffffff;
    }

    .chart-legend {
      display: flex;
      align-items: center;
      gap: 18px;
      flex-wrap: wrap;
      color: var(--muted);
      font-size: 13px;
      font-weight: 800;
    }

    .chart-legend span {
      display: inline-flex;
      align-items: center;
      gap: 7px;
    }

    .chart-legend i {
      width: 12px;
      height: 12px;
      border-radius: 4px;
      display: inline-block;
    }

    .legend-paid {
      background: #0f4ea8;
    }

    .legend-pending {
      background: #ef4444;
    }

    .legend-total {
      width: 24px !important;
      height: 4px !important;
      border-radius: 999px !important;
      background: #2563eb;
    }

    .history-list {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-top: 8px;
    }

    .history-list div {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      padding: 10px 12px;
      border-radius: 14px;
      background: #f8fafc;
    }

    .history-list span {
      color: var(--muted);
      font-weight: 800;
    }

    .history-list strong {
      color: #0f172a;
    }

    .pie-area {
      display: grid;
      grid-template-columns: 260px minmax(0, 1fr);
      gap: 26px;
      align-items: center;
    }

    .pie-chart {
      width: 260px;
      height: 260px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      box-shadow: 0 20px 60px rgba(15, 23, 42, .12);
    }

    .pie-center {
      width: 132px;
      height: 132px;
      border-radius: 50%;
      background: white;
      display: grid;
      place-items: center;
      text-align: center;
      padding: 14px;
      box-shadow: inset 0 0 0 1px rgba(226, 232, 240, .9);
    }

    .pie-center strong {
      font-size: 18px;
      color: #0f172a;
    }

    .pie-center small {
      color: var(--muted);
      font-weight: 800;
    }

    .legend-list {
      display: grid;
      gap: 14px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .legend-dot {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      flex: 0 0 auto;
    }

    .legend-item strong {
      display: block;
      color: #0f172a;
    }

    .legend-item small {
      color: var(--muted);
    }

    .field-error {
      display: block;
      margin-top: 6px;
      color: #dc2626;
      font-size: 12px;
      font-weight: 700;
    }

    @media (max-width: 1180px) {
      .bottom-grid {
        grid-template-columns: 1fr;
      }

      .history-list {
        grid-template-columns: 1fr 1fr;
      }
    }

    @media (max-width: 760px) {
      .summary-grid {
        grid-template-columns: 1fr;
      }

      .pie-area {
        grid-template-columns: 1fr;
        justify-items: center;
      }

      .history-list {
        grid-template-columns: 1fr;
      }

      h1 {
        font-size: 34px;
      }
    }
  `]
})
export class ExpenseAnalysisComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly gastoService = inject(GastoService);

    loading = signal(false);
    erro = signal('');

    categoriasAnalise = signal<CategoriaAnalise[]>([]);
    historicoMensal = signal<MesAnalise[]>([]);
    periodoSelecionado = signal<number>(this.converterMesParaPeriodo(this.getMesAtualInput()));

    tooltipGrafico = signal<TooltipGrafico>({
        visivel: false,
        x: 0,
        y: 0,
        label: '',
        total: 0,
        pago: 0,
        pendente: 0
    });

    private readonly cores = [
        '#2563eb',
        '#7c3aed',
        '#16a34a',
        '#f59e0b',
        '#ef4444',
        '#0891b2',
        '#db2777',
        '#64748b',
        '#84cc16',
        '#ea580c'
    ];

    form = this.fb.nonNullable.group({
        mes: [this.getMesAtualInput(), Validators.required],
        quantidadeMeses: [6, Validators.required]
    });

    totalMes = computed(() =>
        this.categoriasAnalise().reduce((acc, categoria) => acc + categoria.valor, 0)
    );

    maiorCategoria = computed(() => {
        const categorias = this.categoriasAnalise();

        if (categorias.length === 0) {
            return null;
        }

        return categorias[0];
    });

    maiorCategoriaValor = computed(() => this.maiorCategoria()?.valor ?? 0);

    variacaoValor = computed(() => {
        const historico = this.historicoMensal();

        if (historico.length < 2) {
            return 0;
        }

        const atual = historico[historico.length - 1].valor;
        const anterior = historico[historico.length - 2].valor;

        return atual - anterior;
    });

    variacaoPercentual = computed(() => {
        const historico = this.historicoMensal();

        if (historico.length < 2) {
            return 0;
        }

        const atual = historico[historico.length - 1].valor;
        const anterior = historico[historico.length - 2].valor;

        if (anterior === 0 && atual > 0) {
            return 100;
        }

        if (anterior === 0) {
            return 0;
        }

        return ((atual - anterior) / anterior) * 100;
    });

    pizzaGradient = computed(() => {
        const categorias = this.categoriasAnalise();

        if (categorias.length === 0) {
            return '#e5e7eb';
        }

        let inicio = 0;

        const partes = categorias.map(categoria => {
            const fim = inicio + categoria.percentual;
            const parte = `${categoria.cor} ${inicio}% ${fim}%`;
            inicio = fim;
            return parte;
        });

        return `conic-gradient(${partes.join(', ')})`;
    });

    pontosLinha = computed<PontoLinha[]>(() => {
        const historico = this.historicoMensal();

        return historico.map((item, index) => ({
            x: this.getLineX(index),
            y: this.getLineY(item.valor),
            label: item.label,
            valor: item.valor
        }));
    });

    linhaPontos = computed(() =>
        this.pontosLinha()
            .map(ponto => `${ponto.x},${ponto.y}`)
            .join(' ')
    );

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
        this.esconderTooltipGrafico();

        const periodoSelecionado = this.converterMesParaPeriodo(this.form.controls.mes.value);
        const quantidadeMeses = Number(this.form.controls.quantidadeMeses.value);

        this.periodoSelecionado.set(periodoSelecionado);

        const periodos = this.gerarPeriodosAte(periodoSelecionado, quantidadeMeses);

        forkJoin(
            periodos.map(periodo =>
                this.gastoService.resumoPorPeriodo(periodo).pipe(
                    catchError(error => {
                        console.error('Erro ao buscar período:', periodo, error);
                        return of({} as ResumoGastos);
                    })
                )
            )
        ).subscribe({
            next: resumos => {
                const historico = resumos.map((resumo, index) => {
                    const gastos = this.extrairGastosResumo(resumo);
                    const total = this.somarGastos(gastos);
                    const pago = this.somarGastosPorSituacao(gastos, 'PAGO');
                    const pendente = this.somarGastosPorSituacao(gastos, 'PENDENTE');

                    return {
                        periodo: periodos[index],
                        label: this.formatarPeriodoCurto(periodos[index]),
                        valor: total,
                        pago,
                        pendente
                    };
                });

                const resumoSelecionado = resumos[resumos.length - 1];
                const gastosSelecionados = this.extrairGastosResumo(resumoSelecionado);

                this.historicoMensal.set(historico);
                this.categoriasAnalise.set(this.montarAnaliseCategorias(gastosSelecionados));
            },
            error: error => {
                console.error('Erro ao montar análise:', error);
                this.erro.set('Não foi possível carregar a análise dos gastos.');
                this.historicoMensal.set([]);
                this.categoriasAnalise.set([]);
            },
            complete: () => this.loading.set(false)
        });
    }

    periodoSelecionadoFormatado(): string {
        return this.formatarPeriodo(this.periodoSelecionado());
    }

    textoVariacao(): string {
        const variacao = this.variacaoValor();

        if (variacao > 0) {
            return `Subiu ${this.formatarMoeda(variacao)} em relação ao mês anterior`;
        }

        if (variacao < 0) {
            return `Caiu ${this.formatarMoeda(Math.abs(variacao))} em relação ao mês anterior`;
        }

        return 'Sem variação em relação ao mês anterior';
    }

    getMaxGrafico(): number {
        const historico = this.historicoMensal();

        if (historico.length === 0) {
            return 1000;
        }

        const maiorValor = Math.max(
            ...historico.map(item => Math.max(item.valor, item.pago, item.pendente)),
            1
        );

        const valorComFolga = maiorValor * 1.12;

        return Math.ceil(valorComFolga / 1000) * 1000;
    }

    getValorEixo(posicao: number): number {
        return (this.getMaxGrafico() / 5) * posicao;
    }

    formatarValorEixo(valor: number): string {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            maximumFractionDigits: 0
        }).format(valor);
    }

    getBarHeight(valor: number): number {
        const max = this.getMaxGrafico();
        const alturaMaxima = 218;

        return (valor / max) * alturaMaxima;
    }

    getBarY(valor: number): number {
        const baseY = 248;

        return baseY - this.getBarHeight(valor);
    }

    getGrupoCentroX(index: number): number {
        const inicioX = 92;
        const quantidade = Math.max(this.historicoMensal().length, 1);
        const larguraUtil = 560;
        const larguraGrupo = larguraUtil / quantidade;

        return inicioX + (index * larguraGrupo) + (larguraGrupo / 2);
    }

    getBarX(index: number, tipo: 'pago' | 'pendente'): number {
        const centroGrupo = this.getGrupoCentroX(index);
        const deslocamento = tipo === 'pago' ? -18 : 4;

        return centroGrupo + deslocamento;
    }

    getLabelX(index: number): number {
        return this.getGrupoCentroX(index) - 2;
    }

    getLineX(index: number): number {
        return this.getGrupoCentroX(index) - 2;
    }

    getLineY(valor: number): number {
        const max = this.getMaxGrafico();
        const baseY = 248;
        const alturaMaxima = 218;

        return baseY - ((valor / max) * alturaMaxima);
    }

    mostrarTooltipGrafico(event: MouseEvent, mes: MesAnalise): void {
        const elemento = event.currentTarget as SVGElement;
        const container = elemento.closest('.combo-chart-box') as HTMLElement;

        if (!container) {
            return;
        }

        const rect = container.getBoundingClientRect();

        this.tooltipGrafico.set({
            visivel: true,
            x: event.clientX - rect.left + 14,
            y: event.clientY - rect.top - 18,
            label: mes.label,
            total: mes.valor,
            pago: mes.pago,
            pendente: mes.pendente
        });
    }

    esconderTooltipGrafico(): void {
        this.tooltipGrafico.update(tooltip => ({
            ...tooltip,
            visivel: false
        }));
    }

    getHoverAreaX(index: number): number {
        const centro = this.getGrupoCentroX(index);
        const largura = this.getHoverAreaWidth();

        return centro - (largura / 2);
    }

    getHoverAreaWidth(): number {
        const quantidade = Math.max(this.historicoMensal().length, 1);
        const larguraUtil = 560;

        return larguraUtil / quantidade;
    }

    private montarAnaliseCategorias(gastos: Gasto[]): CategoriaAnalise[] {
        const total = this.somarGastos(gastos);
        const mapa = new Map<string, number>();

        for (const gasto of gastos) {
            const categoria = gasto.nomeCategoria || 'Sem categoria';
            const valorAtual = mapa.get(categoria) ?? 0;

            mapa.set(categoria, valorAtual + Number(gasto.valor || 0));
        }

        return Array.from(mapa.entries())
            .map(([nome, valor], index) => ({
                nome,
                valor,
                percentual: total > 0 ? (valor / total) * 100 : 0,
                cor: this.cores[index % this.cores.length]
            }))
            .sort((a, b) => b.valor - a.valor);
    }

    private extrairGastosResumo(resumo: ResumoGastos): Gasto[] {
        const resumoAny = resumo as any;

        return resumoAny.gastosDTO
            ?? resumoAny.gastos
            ?? resumoAny.listaGastos
            ?? [];
    }

    private somarGastos(gastos: Gasto[]): number {
        return gastos.reduce((acc, gasto) => acc + Number(gasto.valor || 0), 0);
    }

    private somarGastosPorSituacao(gastos: Gasto[], situacao: string): number {
        return gastos
            .filter(gasto => gasto.situacao === situacao)
            .reduce((acc, gasto) => acc + Number(gasto.valor || 0), 0);
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

    private gerarPeriodosAte(periodoFinal: number, quantidade: number): number[] {
        const periodoTexto = String(periodoFinal);
        const ano = Number(periodoTexto.slice(0, 4));
        const mes = Number(periodoTexto.slice(4, 6));

        const data = new Date(ano, mes - 1, 1);
        const periodos: number[] = [];

        for (let i = quantidade - 1; i >= 0; i--) {
            const dataPeriodo = new Date(data);
            dataPeriodo.setMonth(data.getMonth() - i);

            const anoPeriodo = dataPeriodo.getFullYear();
            const mesPeriodo = String(dataPeriodo.getMonth() + 1).padStart(2, '0');

            periodos.push(Number(`${anoPeriodo}${mesPeriodo}`));
        }

        return periodos;
    }

    private formatarPeriodo(periodo: number): string {
        const periodoTexto = String(periodo);
        const ano = periodoTexto.slice(0, 4);
        const mes = periodoTexto.slice(4, 6);

        return `${mes}/${ano}`;
    }

    private formatarPeriodoCurto(periodo: number): string {
        const periodoTexto = String(periodo);
        const ano = periodoTexto.slice(2, 4);
        const mes = periodoTexto.slice(4, 6);

        return `${mes}/${ano}`;
    }

    private formatarMoeda(valor: number): string {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor);
    }
}