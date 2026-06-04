import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { Categoria, Gasto } from '../../core/models/gasto.models';
import { GastoService } from '../../core/services/gasto.service';
import { CategoriaService } from '../../core/services/categoria.service';

@Component({
    selector: 'app-expenses',
    standalone: true,
    imports: [ReactiveFormsModule, CurrencyPipe, DatePipe],
    template: `
    <section class="container page-head">
      <div>
        <span class="eyebrow">Gastos</span>
        <h1>Gerenciar despesas</h1>
        <p>Cadastre, edite e acompanhe seus gastos pessoais.</p>
      </div>
    </section>

    <section class="container expenses-grid">
      <form class="card form-card" [formGroup]="form" (ngSubmit)="salvar()">
        <h2>{{ editandoId() ? 'Editar gasto' : 'Novo gasto' }}</h2>

        @if (erro()) {
          <div class="error">{{ erro() }}</div>
        }

        <div class="field">
          <label>Descrição</label>
          <input formControlName="descricao" placeholder="Ex.: Supermercado">

          @if (form.controls.descricao.touched && form.controls.descricao.hasError('required')) {
            <small class="field-error">Descrição é obrigatória.</small>
          }
        </div>

        <div class="field">
          <label>Valor</label>
          <input
            type="text"
            [value]="valorFormatado()"
            placeholder="R$ 0,00"
            inputmode="decimal"
            (input)="aoDigitarValor($event)"
            (blur)="formatarValorNoCampo()"
          >

          @if (form.controls.valor.touched && form.controls.valor.hasError('required')) {
            <small class="field-error">Valor é obrigatório.</small>
          }

          @if (form.controls.valor.touched && form.controls.valor.hasError('min')) {
            <small class="field-error">Valor precisa ser maior que zero.</small>
          }
        </div>

        <div class="field">
          <label>DataVencimento</label>
          <input formControlName="dataVencimento" type="date">
        </div>

        <div class="field">
          <label>DataPagamento</label>
          <input formControlName="dataPagamento" type="date">
        </div>

        <div class="field">
          <label>Situação</label>
          <select formControlName="situacao">
            <option value="PENDENTE">Pendente</option>
            <option value="PAGO">Pago</option>
            <option value="CANCELADO">Cancelado</option>
          </select>
        </div>

        <div class="field">
          <label>Categoria</label>

          <select formControlName="idCategoria">
            <option [ngValue]="0">Selecione</option>

            @for (categoria of categorias(); track categoria.id) {
              <option [ngValue]="categoria.id">
                {{ categoria.nome }}
              </option>
            }
          </select>

          @if (form.controls.idCategoria.touched && form.controls.idCategoria.value === 0) {
            <small class="field-error">Categoria é obrigatória.</small>
          }
        </div>

        <div class="actions">
          <button
            type="submit"
            class="btn btn-primary"
            [disabled]="salvando()"
          >
            {{ salvando() ? 'Salvando...' : 'Salvar' }}
          </button>

          @if (editandoId()) {
            <button
              type="button"
              class="btn btn-secondary"
              (click)="limpar()"
            >
              Cancelar
            </button>
          }
        </div>
      </form>

      <article class="card table-card">
        <div class="toolbar">
          <div>
            <h2>Lista de gastos</h2>
            <small>{{ gastosFiltrados().length }} registro(s)</small>
          </div>

          <input
            [value]="filtro()"
            (input)="filtro.set($any($event.target).value)"
            placeholder="Buscar descrição..."
          >
        </div>

        @if (loading()) {
          <div class="empty">Carregando gastos...</div>
        } @else if (gastosFiltrados().length === 0) {
          <div class="empty">Nenhum gasto encontrado.</div>
        } @else {
          <div class="table">
            <div class="row header">
              <span>Descrição</span>
              <span>Vencimento</span>
              <span>Período</span>
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
                  <small>{{ gasto.nomeCategoria || 'Sem categoria' }}</small>
                </span>

                <span>{{ gasto.dataVencimento | date:'dd/MM/yyyy' }}</span>

                <span>{{ formatarPeriodo(gasto.periodo) }}</span>

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

    .expenses-grid {
      display: grid;
      grid-template-columns: 380px minmax(0, 1fr);
      gap: 18px;
      align-items: start;
    }

    .form-card,
    .table-card {
      padding: 24px;
    }

    .form-card {
      display: grid;
      gap: 16px;
    }

    .form-card h2,
    .toolbar h2 {
      margin: 0;
    }

    .actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 18px;
    }

    .toolbar small {
      color: var(--muted);
    }

    .toolbar input {
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 12px 14px;
      min-width: 260px;
    }

    .table {
      width: 100%;
      display: block;
      overflow-x: auto;
    }

    .row {
      display: grid;
      grid-template-columns: minmax(190px, 1.5fr) 110px 90px 110px 120px 150px;
      gap: 14px;
      align-items: center;
      padding: 14px 0;
      border-bottom: 1px solid var(--border);
      min-width: 820px;
      transition: background .25s ease, box-shadow .25s ease;
    }

    .row-paid-flash {
      background: linear-gradient(90deg, rgba(220, 252, 231, .9), rgba(255, 255, 255, 0));
      box-shadow: inset 4px 0 0 #22c55e;
    }

    .row.header {
      color: var(--muted);
      font-size: 12px;
      font-weight: 900;
      text-transform: uppercase;
      background: transparent;
      box-shadow: none;
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
      .expenses-grid {
        grid-template-columns: 1fr;
      }

      .row {
        grid-template-columns: 1fr;
        gap: 8px;
        min-width: 0;
        padding: 16px 0;
      }

      .row.header {
        display: none;
      }

      .toolbar {
        display: block;
      }

      .toolbar input {
        width: 100%;
        margin-top: 14px;
        min-width: 0;
      }

      .row-actions {
        margin-top: 8px;
      }
    }
  `]
})
export class ExpensesComponent implements OnInit {
    private readonly gastoService = inject(GastoService);
    private readonly fb = inject(FormBuilder);
    private readonly categoriaService = inject(CategoriaService);
    private readonly route = inject(ActivatedRoute);

    categorias = signal<Categoria[]>([]);
    gastos = signal<Gasto[]>([]);
    filtro = signal('');
    loading = signal(false);
    salvando = signal(false);
    erro = signal('');
    editandoId = signal<number | null>(null);
    periodoFiltro = signal<number | null>(null);
    valorFormatado = signal('');

    idsPagando = signal<number[]>([]);
    idsPagosRecentemente = signal<number[]>([]);

    gastosFiltrados = computed(() => {
        const termo = this.filtro().toLowerCase().trim();

        if (!termo) {
            return this.gastos();
        }

        return this.gastos().filter(gasto =>
            `${gasto.descricao ?? ''} ${gasto.nomeCategoria ?? ''}`
                .toLowerCase()
                .includes(termo)
        );
    });

    form = this.fb.nonNullable.group({
        descricao: ['', Validators.required],
        valor: [0, [Validators.required, Validators.min(0.01)]],
        periodo: [this.getPeriodo(), Validators.required],
        dataVencimento: [new Date().toISOString().slice(0, 10), Validators.required],
        dataPagamento: [''],
        situacao: ['PENDENTE', Validators.required],
        idCategoria: [0, Validators.required]
    });

    ngOnInit(): void {
        this.carregarCategorias();

        this.route.queryParamMap.subscribe(params => {
            const periodo = params.get('periodo');

            this.periodoFiltro.set(periodo ? Number(periodo) : null);
            this.carregar();
        });
    }

    carregar(): void {
        this.loading.set(true);

        this.gastoService.listar(0, 100, this.filtro(), this.periodoFiltro()).subscribe({
            next: result => {
                const gastos = Array.isArray(result)
                    ? result
                    : result?.content ?? [];

                this.gastos.set(gastos);
            },
            error: error => {
                console.error('Erro ao carregar gastos:', error);
                this.erro.set('Não foi possível carregar os gastos.');
            },
            complete: () => this.loading.set(false)
        });
    }

    salvar(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            this.erro.set('Preencha os campos obrigatórios corretamente.');
            return;
        }

        this.salvando.set(true);
        this.erro.set('');

        const formValue = this.form.getRawValue();

        const periodo = this.getPeriodoPorDataVencimento(formValue.dataVencimento);

        const payload = {
            ...formValue,
            periodo,
            valor: Number(formValue.valor),
            dataVencimento: this.formatarDataVencimentoParaBackend(formValue.dataVencimento),
            dataPagamento: this.formatarDataPagamentoParaBackend(formValue.dataPagamento)
        } as Gasto;

        const id = this.editandoId();

        const request = id
            ? this.gastoService.atualizar(id, payload)
            : this.gastoService.criar(payload);

        request.subscribe({
            next: () => {
                this.limpar();
                this.carregar();
                this.salvando.set(false);
            },
            error: error => {
                console.error('Erro ao salvar gasto:', error);
                this.erro.set('Não foi possível salvar. Confira os campos enviados para o backend.');
                this.salvando.set(false);
            }
        });
    }
    editar(gasto: Gasto): void {
        if (!gasto.id) {
            return;
        }

        this.editandoId.set(gasto.id);

        this.form.patchValue({
            descricao: gasto.descricao,
            valor: Number(gasto.valor),
            periodo: Number(gasto.periodo),
            dataVencimento: gasto.dataVencimento?.slice(0, 10),
            dataPagamento: gasto.dataPagamento?.slice(0, 10) ?? '',
            situacao: gasto.situacao,
            idCategoria: gasto.idCategoria ?? 0
        });

        this.valorFormatado.set(this.formatarMoeda(Number(gasto.valor ?? 0)));
    }

    excluir(gasto: Gasto): void {
        if (!gasto.id || !confirm(`Excluir o gasto "${gasto.descricao}"?`)) {
            return;
        }

        const listaAnterior = [...this.gastos()];

        this.gastos.set(this.gastos().filter(item => item.id !== gasto.id));

        this.gastoService.excluir(gasto.id).subscribe({
            error: () => {
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

    private getPeriodo(): number {
        const hoje = new Date();
        const ano = hoje.getFullYear();
        const mes = String(hoje.getMonth() + 1).padStart(2, '0');

        return Number(`${ano}${mes}`);
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

    private formatarDataVencimentoParaBackend(data?: string): string | null {
        if (!data) {
            return null;
        }

        if (data.includes('/')) {
            return data;
        }

        const [ano, mes, dia] = data.split('-');

        return `${dia}/${mes}/${ano}`;
    }

    private formatarDataPagamentoParaBackend(data?: string): string | null {
        if (!data) {
            return null;
        }

        if (data.includes('/')) {
            return data.includes(':') ? data : `${data} 00:00:00`;
        }

        const [ano, mes, dia] = data.split('-');

        return `${dia}/${mes}/${ano} 00:00:00`;
    }

    limpar(): void {
        this.editandoId.set(null);

        this.form.reset({
            descricao: '',
            valor: 0,
            periodo: this.getPeriodo(),
            dataVencimento: new Date().toISOString().slice(0, 10),
            dataPagamento: '',
            situacao: 'PENDENTE',
            idCategoria: 0
        });

        this.valorFormatado.set('');
        this.salvando.set(false);
    }

    aoDigitarValor(event: Event): void {
        const input = event.target as HTMLInputElement;
        const valor = input.value.replace(/\D/g, '');

        if (!valor) {
            this.form.controls.valor.setValue(0);
            this.valorFormatado.set('');
            return;
        }

        const valorNumerico = Number(valor) / 100;

        this.form.controls.valor.setValue(valorNumerico);
        this.valorFormatado.set(this.formatarMoeda(valorNumerico));
    }

    formatarValorNoCampo(): void {
        const valor = this.form.controls.valor.value;

        if (!valor || valor <= 0) {
            this.valorFormatado.set('');
            return;
        }

        this.valorFormatado.set(this.formatarMoeda(valor));
    }

    private formatarMoeda(valor: number): string {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor);
    }

    private getPeriodoPorDataVencimento(dataVencimento: string): number {
        const [ano, mes] = dataVencimento.split('-');

        return Number(`${ano}${mes}`);
    }

    carregarCategorias(): void {
        this.categoriaService.listar().subscribe({
            next: categorias => this.categorias.set(categorias),
            error: erro => {
                console.error('ERRO CATEGORIAS:', erro);
                this.erro.set('Não foi possível carregar as categorias.');
            }
        });
    }
}