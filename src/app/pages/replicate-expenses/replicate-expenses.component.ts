import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { GastoService } from '../../core/services/gasto.service';

@Component({
    selector: 'app-replicate-expenses',
    standalone: true,
    imports: [ReactiveFormsModule, RouterLink],
    template: `
    <section class="container page-head">
      <div>
        <span class="eyebrow">Replicação</span>
        <h1>Replicar gastos</h1>
        <p>Copie os gastos de um mês para outro de forma rápida e segura.</p>
      </div>

      <a
        class="btn btn-secondary"
        routerLink="/ver-gastos"
      >
        Ver gastos
      </a>
    </section>

    <section class="container replicate-layout">
      <form class="card replicate-card" [formGroup]="form" (ngSubmit)="replicar()">
        <div class="card-head">
          <div>
            <h2>Configurar replicação</h2>
            <p>Escolha o período de origem e o período para onde os gastos serão copiados.</p>
          </div>
        </div>

        @if (erro()) {
          <div class="error">{{ erro() }}</div>
        }

        @if (sucesso()) {
          <div class="success">{{ sucesso() }}</div>
        }

        <div class="period-grid">
          <div class="period-box">
            <span class="period-label">Período atual</span>

            <div class="field">
              <label>Mês atual</label>
              <select formControlName="mesAtual">
                @for (mes of meses; track mes.valor) {
                  <option [value]="mes.valor">{{ mes.nome }}</option>
                }
              </select>
            </div>

            <div class="field">
              <label>Ano atual</label>
              <select formControlName="anoAtual">
                @for (ano of anos; track ano) {
                  <option [value]="ano">{{ ano }}</option>
                }
              </select>
            </div>
          </div>

          <div class="arrow-box">
            <div class="arrow-icon">→</div>
            <small>copiar para</small>
          </div>

          <div class="period-box destination">
            <span class="period-label">Período a replicar</span>

            <div class="field">
              <label>Mês a replicar</label>
              <select formControlName="mesReplicar">
                @for (mes of meses; track mes.valor) {
                  <option [value]="mes.valor">{{ mes.nome }}</option>
                }
              </select>
            </div>

            <div class="field">
              <label>Ano a replicar</label>
              <select formControlName="anoReplicar">
                @for (ano of anos; track ano) {
                  <option [value]="ano">{{ ano }}</option>
                }
              </select>
            </div>
          </div>
        </div>

        <div class="preview-card">
          <div>
            <span>Origem</span>
            <strong>{{ periodoAtualFormatado() }}</strong>
          </div>

          <div>
            <span>Destino</span>
            <strong>{{ periodoReplicarFormatado() }}</strong>
          </div>
        </div>

        <div class="actions">
          <button
            type="submit"
            class="btn btn-primary"
            [disabled]="replicando()"
          >
            {{ replicando() ? 'Replicando...' : 'Replicar gastos' }}
          </button>

          <button
            type="button"
            class="btn btn-secondary"
            [disabled]="replicando()"
            (click)="limparMensagens()"
          >
            Limpar mensagens
          </button>
        </div>
      </form>
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

    .replicate-layout {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
    }

    .replicate-card {
      padding: 28px;
      display: grid;
      gap: 24px;
    }

    .card-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 18px;
    }

    .card-head h2 {
      margin: 0 0 6px;
      font-size: 28px;
    }

    .period-grid {
      display: grid;
      grid-template-columns: 1fr 110px 1fr;
      gap: 18px;
      align-items: stretch;
    }

    .period-box {
      border: 1px solid var(--border);
      border-radius: 24px;
      padding: 22px;
      background: rgba(255, 255, 255, .68);
      display: grid;
      gap: 16px;
      box-shadow: 0 18px 40px rgba(15, 23, 42, .06);
    }

    .period-box.destination {
      background: linear-gradient(135deg, rgba(239, 246, 255, .9), rgba(245, 243, 255, .9));
    }

    .period-label {
      display: inline-flex;
      width: fit-content;
      padding: 7px 10px;
      border-radius: 999px;
      background: #eef2ff;
      color: #3730a3;
      font-size: 12px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: .08em;
    }

    .arrow-box {
      display: grid;
      place-items: center;
      align-content: center;
      gap: 8px;
      color: var(--muted);
      font-weight: 800;
    }

    .arrow-icon {
      width: 58px;
      height: 58px;
      border-radius: 20px;
      background: linear-gradient(135deg, #2563eb, #7c3aed);
      color: white;
      display: grid;
      place-items: center;
      font-size: 30px;
      box-shadow: 0 18px 35px rgba(37, 99, 235, .25);
    }

    .preview-card {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }

    .preview-card div {
      border-radius: 20px;
      background: #f8fafc;
      border: 1px solid var(--border);
      padding: 18px;
    }

    .preview-card span {
      display: block;
      color: var(--muted);
      font-size: 12px;
      text-transform: uppercase;
      font-weight: 900;
      margin-bottom: 8px;
    }

    .preview-card strong {
      font-size: 24px;
      color: #0f172a;
    }

    .actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .success {
      padding: 14px;
      border-radius: 14px;
      background: #dcfce7;
      color: #166534;
      font-weight: 800;
    }

    @media (max-width: 900px) {
      .page-head {
        display: block;
      }

      .page-head .btn {
        margin-top: 16px;
      }

      .period-grid {
        grid-template-columns: 1fr;
      }

      .arrow-box {
        padding: 4px 0;
      }

      .arrow-icon {
        transform: rotate(90deg);
      }

      .preview-card {
        grid-template-columns: 1fr;
      }

      h1 {
        font-size: 34px;
      }
    }
  `]
})
export class ReplicateExpensesComponent {
    private readonly fb = inject(FormBuilder);
    private readonly gastoService = inject(GastoService);

    replicando = signal(false);
    erro = signal('');
    sucesso = signal('');

    meses = [
        { valor: '01', nome: 'Janeiro' },
        { valor: '02', nome: 'Fevereiro' },
        { valor: '03', nome: 'Março' },
        { valor: '04', nome: 'Abril' },
        { valor: '05', nome: 'Maio' },
        { valor: '06', nome: 'Junho' },
        { valor: '07', nome: 'Julho' },
        { valor: '08', nome: 'Agosto' },
        { valor: '09', nome: 'Setembro' },
        { valor: '10', nome: 'Outubro' },
        { valor: '11', nome: 'Novembro' },
        { valor: '12', nome: 'Dezembro' }
    ];

    anos = this.gerarAnos();

    private hoje = new Date();
    private mesAtual = String(this.hoje.getMonth() + 1).padStart(2, '0');
    private anoAtual = this.hoje.getFullYear();

    form = this.fb.nonNullable.group({
        mesAtual: [this.mesAtual, Validators.required],
        anoAtual: [this.anoAtual, Validators.required],
        mesReplicar: [this.getProximoMes().mes, Validators.required],
        anoReplicar: [this.getProximoMes().ano, Validators.required]
    });

    replicar(): void {
        this.erro.set('');
        this.sucesso.set('');

        if (this.form.invalid) {
            this.form.markAllAsTouched();
            this.erro.set('Preencha todos os campos obrigatórios.');
            return;
        }

        const periodoAtual = this.montarPeriodo(
            this.form.controls.anoAtual.value,
            this.form.controls.mesAtual.value
        );

        const periodoReplicar = this.montarPeriodo(
            this.form.controls.anoReplicar.value,
            this.form.controls.mesReplicar.value
        );

        if (periodoAtual === periodoReplicar) {
            this.erro.set('O período de origem e o período de destino não podem ser iguais.');
            return;
        }

        this.replicando.set(true);

        this.gastoService.replicarGastos(periodoAtual, periodoReplicar).subscribe({
            next: () => {
                this.sucesso.set(
                    `Gastos replicados de ${this.formatarPeriodo(periodoAtual)} para ${this.formatarPeriodo(periodoReplicar)} com sucesso.`
                );
            },
            error: error => {
                console.error('Erro ao replicar gastos:', error);
                this.erro.set('Não foi possível replicar. Verifique se já existem gastos no mês de destino.');
            },
            complete: () => this.replicando.set(false)
        });
    }

    periodoAtualFormatado(): string {
        const periodo = this.montarPeriodo(
            this.form.controls.anoAtual.value,
            this.form.controls.mesAtual.value
        );

        return this.formatarPeriodo(periodo);
    }

    periodoReplicarFormatado(): string {
        const periodo = this.montarPeriodo(
            this.form.controls.anoReplicar.value,
            this.form.controls.mesReplicar.value
        );

        return this.formatarPeriodo(periodo);
    }

    limparMensagens(): void {
        this.erro.set('');
        this.sucesso.set('');
    }

    private montarPeriodo(ano: number, mes: string): number {
        return Number(`${ano}${mes}`);
    }

    private formatarPeriodo(periodo: number): string {
        const periodoTexto = String(periodo);
        const ano = periodoTexto.slice(0, 4);
        const mes = periodoTexto.slice(4, 6);

        return `${mes}/${ano}`;
    }

    private gerarAnos(): number[] {
        const anoBase = new Date().getFullYear();
        const anos: number[] = [];

        for (let ano = anoBase - 5; ano <= anoBase + 5; ano++) {
            anos.push(ano);
        }

        return anos;
    }

    private getProximoMes(): { mes: string; ano: number } {
        const data = new Date();
        data.setMonth(data.getMonth() + 1);

        return {
            mes: String(data.getMonth() + 1).padStart(2, '0'),
            ano: data.getFullYear()
        };
    }
}