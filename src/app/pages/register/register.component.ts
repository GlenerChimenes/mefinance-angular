import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UserService } from "../../core/services/user.service";

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [ReactiveFormsModule, RouterLink],
    template: `
    <section class="register-page">
      <div class="hero">
        <span class="pill">MeFinance</span>
        <h1>Crie sua conta e comece a controlar seus gastos.</h1>
        <p>Cadastre seu usuário para acessar o dashboard financeiro.</p>
      </div>

      <form class="card register-card" [formGroup]="form" (ngSubmit)="salvar()">
        <h2>Cadastrar usuário</h2>
        <p>Informe seus dados para criar o acesso.</p>

        @if (erro()) {
          <div class="error">{{ erro() }}</div>
        }

        @if (sucesso()) {
          <div class="success">{{ sucesso() }}</div>
        }

        <div class="field">
          <label>Nome</label>
          <input formControlName="nome" placeholder="Seu nome completo">

          @if (form.controls.nome.touched && form.controls.nome.hasError('required')) {
            <small class="field-error">Nome é obrigatório.</small>
          }
        </div>

        <div class="field">
          <label>E-mail</label>
          <input formControlName="email" type="email" placeholder="seu@email.com">

          @if (form.controls.email.touched && form.controls.email.hasError('required')) {
            <small class="field-error">E-mail é obrigatório.</small>
          }

          @if (form.controls.email.touched && form.controls.email.hasError('email')) {
            <small class="field-error">Informe um e-mail válido.</small>
          }
        </div>

        <div class="field">
          <label>Renda mensal</label>
          <input formControlName="rendaMensal" type="number" step="0.01" placeholder="0,00">

          @if (form.controls.rendaMensal.touched && form.controls.rendaMensal.hasError('min')) {
            <small class="field-error">Renda mensal deve ser maior que zero.</small>
          }
        </div>

        <div class="field">
          <label>Senha</label>
          <input formControlName="password" type="password" placeholder="Digite sua senha">

          @if (form.controls.password.touched && form.controls.password.hasError('required')) {
            <small class="field-error">Senha é obrigatória.</small>
          }

          @if (form.controls.password.touched && form.controls.password.hasError('minlength')) {
            <small class="field-error">Senha deve ter pelo menos 6 caracteres.</small>
          }
        </div>

        <div class="field">
          <label>Confirmar senha</label>
          <input formControlName="confirmPassword" type="password" placeholder="Confirme sua senha">

          @if (form.controls.confirmPassword.touched && form.controls.confirmPassword.hasError('required')) {
            <small class="field-error">Confirmação de senha é obrigatória.</small>
          }
        </div>

        <button class="btn btn-primary" [disabled]="salvando()">
          {{ salvando() ? 'Cadastrando...' : 'Cadastrar' }}
        </button>

        <a class="back-link" routerLink="/login">Voltar para o login</a>
      </form>
    </section>
  `,
    styles: [`
    .register-page {
      min-height: 100vh;
      display: grid;
      grid-template-columns: 1fr 460px;
      gap: 34px;
      align-items: center;
      width: min(1120px, calc(100% - 32px));
      margin: 0 auto;
    }

    .hero {
      padding: 20px;
    }

    .pill {
      display: inline-flex;
      padding: 8px 12px;
      border-radius: 999px;
      background: #dbeafe;
      color: #1d4ed8;
      font-weight: 800;
    }

    .hero h1 {
      font-size: clamp(40px, 6vw, 68px);
      line-height: .98;
      margin: 22px 0;
      background: linear-gradient(135deg, #111827, #2563eb, #7c3aed);
      -webkit-background-clip: text;
      color: transparent;
    }

    .hero p {
      font-size: 19px;
      color: var(--muted);
      max-width: 650px;
    }

    .register-card {
      padding: 32px;
      display: grid;
      gap: 16px;
    }

    .register-card h2 {
      margin: 0;
      font-size: 32px;
    }

    .register-card p {
      margin: 0;
      color: var(--muted);
    }

    .register-card button {
      justify-content: center;
      margin-top: 4px;
    }

    .field-error {
      display: block;
      margin-top: 6px;
      color: #dc2626;
      font-size: 12px;
      font-weight: 700;
    }

    .success {
      padding: 14px;
      border-radius: 14px;
      background: #dcfce7;
      color: #166534;
      font-weight: 700;
    }

    .back-link {
      text-align: center;
      color: #2563eb;
      font-weight: 800;
    }

    @media(max-width: 900px) {
      .register-page {
        grid-template-columns: 1fr;
      }

      .hero h1 {
        font-size: 42px;
      }

      .register-card {
        margin-bottom: 24px;
      }
    }
  `]
})
export class RegisterComponent {
    private readonly fb = inject(FormBuilder);
    private readonly userService = inject(UserService);
    private readonly router = inject(Router);

    salvando = signal(false);
    erro = signal('');
    sucesso = signal('');

    form = this.fb.nonNullable.group({
        nome: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        rendaMensal: [0, [Validators.required, Validators.min(0.01)]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required]
    });

    salvar(): void {
        this.erro.set('');
        this.sucesso.set('');

        if (this.form.invalid) {
            this.form.markAllAsTouched();
            this.erro.set('Preencha todos os campos obrigatórios corretamente.');
            return;
        }

        const formValue = this.form.getRawValue();

        if (formValue.password !== formValue.confirmPassword) {
            this.erro.set('As senhas não conferem.');
            return;
        }

        this.salvando.set(true);

        const payload = {
            nome: formValue.nome,
            email: formValue.email,
            rendaMensal: formValue.rendaMensal,
            password: formValue.password
        };

        this.userService.cadastrar(payload).subscribe({
            next: () => {
                this.sucesso.set('Usuário cadastrado com sucesso. Redirecionando para o login...');

                setTimeout(() => {
                    this.router.navigateByUrl('/login');
                }, 1200);
            },
            error: error => {
                console.error('Erro ao cadastrar usuário:', error);
                this.erro.set('Não foi possível cadastrar. Verifique se o e-mail já está em uso.');
                this.salvando.set(false);
            }
        });
    }
}