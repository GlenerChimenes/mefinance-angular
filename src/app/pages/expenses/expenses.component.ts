import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Gasto } from '../../core/models/gasto.models';
import { GastoService } from '../../core/services/gasto.service';
import { CategoriaService } from '../../core/services/categoria.service';
import { Categoria } from '../../core/models/gasto.models';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [ReactiveFormsModule, CurrencyPipe, DatePipe],
  template: `
    <section class="container page-head">
      <div><span class="eyebrow">Gastos</span><h1>Gerenciar despesas</h1><p>Cadastre, edite e acompanhe seus gastos pessoais.</p></div>
    </section>

    <section class="container expenses-grid">
      <form class="card form-card" [formGroup]="form" (ngSubmit)="salvar()">
        <h2>{{ editandoId() ? 'Editar gasto' : 'Novo gasto' }}</h2>
        @if (erro()) { <div class="error">{{ erro() }}</div> }
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
        <div class="field"><label>DataVencimento</label><input formControlName="dataVencimento" type="date"></div>
        <div class="field"><label>DataPagamento</label><input formControlName="dataPagamento" type="date"></div>
        <div class="field"><label>Situação</label><select formControlName="situacao"><option value="PENDENTE">Pendente</option><option value="PAGO">Pago</option><option value="CANCELADO">Cancelado</option></select></div>
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
                        <div class="row">
          <span>
            <span>
                <strong>{{ gasto.descricao }}</strong>
                <small>{{ gasto.nomeCategoria || 'Sem categoria' }}</small>
            </span>
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

                            <span class="money">{{ gasto.valor | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>

                            <span class="row-actions">
              @if (gasto.situacao !== 'PAGO') {
                  <button class="mini success" (click)="pagar(gasto)">Pagar</button>
              }                   
            <button class="mini" (click)="editar(gasto)">Editar</button>
            <button class="mini danger" (click)="excluir(gasto)">Excluir</button>
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
        grid-template-columns: 380px 1fr;
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
        display: grid;
        overflow-x: auto;
      }

      .row {
        display: grid;
        grid-template-columns: 1.5fr .8fr .7fr .8fr .8fr 160px;
        gap: 14px;
        align-items: center;
        padding: 14px 0;
        border-bottom: 1px solid var(--border);
        min-width: 780px;
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
      }

      .row-actions {
        display: flex;
        gap: 8px;
      }

      .mini {
        border: 0;
        border-radius: 12px;
        background: #eef2ff;
        color: #3730a3;
        padding: 8px 10px;
        font-weight: 800;
        cursor: pointer;
      }

      .mini.danger {
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
  private readonly categoriaService = inject(CategoriaService); categorias = signal<Categoria[]>([]);
  private readonly route = inject(ActivatedRoute);
  gastos = signal<Gasto[]>([]);
  filtro = signal('');
  loading = signal(false);
  salvando = signal(false);
  erro = signal('');
  editandoId = signal<number | null>(null);

  periodoFiltro = signal<number | null>(null);

  gastosFiltrados = computed(() => {
    const termo = this.filtro().toLowerCase().trim();
    if (!termo) return this.gastos();
    return this.gastos().filter(g => `${g.descricao} ${g.categoria ?? ''}`.toLowerCase().includes(termo));
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

        const periodoTexto = String(periodo);
        const ano = periodoTexto.slice(0, 4);
        const mes = periodoTexto.slice(4, 6);

        return `${mes}/${ano}`;
    }

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

        const payload = {
            ...formValue,
            valor: Number(formValue.valor),
            dataVencimento: this.formatarDataVencimentoParaBackend(formValue.dataVencimento),
            dataPagamento: this.formatarDataPagamentoParaBackend(formValue.dataPagamento)
        } as Gasto;

        console.log('PAYLOAD ENVIADO:', payload);

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
        if (!gasto.id) return;

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
    if (!gasto.id || !confirm(`Excluir o gasto "${gasto.descricao}"?`)) return;
    this.gastoService.excluir(gasto.id).subscribe({ next: () => this.carregar(), error: () => this.erro.set('Não foi possível excluir o gasto.') });
  }

    pagar(gasto: Gasto): void {
        if (!gasto.id) {
            return;
        }

        if (!confirm(`Marcar o gasto "${gasto.descricao}" como pago?`)) {
            return;
        }

        this.gastoService.pagarGasto(gasto.id).subscribe({
            next: () => this.carregar(),
            error: () => this.erro.set('Não foi possível marcar o gasto como pago.')
        });
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

        let valor = input.value.replace(/\D/g, '');

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

    valorFormatado = signal('');

    carregarCategorias(): void {
        this.categoriaService.listar().subscribe({
            next: categorias => {
                console.log('CATEGORIAS:', categorias);
                this.categorias.set(categorias);
            },
            error: erro => {
                console.error('ERRO CATEGORIAS:', erro);
            }
        });
    }
}
