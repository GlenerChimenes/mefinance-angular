import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="login-page">
      <div class="hero">
        <span class="pill">MeFinance</span>
        <h1>Controle seus gastos com uma experiência moderna.</h1>
        <p>Dashboard, resumo financeiro, cadastro e acompanhamento de gastos integrados ao seu backend Spring Boot.</p>
      </div>
      <form class="card login-card" [formGroup]="form" (ngSubmit)="submit()">
        <h2>Entrar</h2>
        <p>Acesse usando o usuário cadastrado na API.</p>
        @if (error) { <div class="error">{{ error }}</div> }
        <div class="field"><label>E-mail ou usuário</label><input formControlName="username" autocomplete="username" placeholder="seu@email.com"></div>
        <div class="field"><label>Senha</label><input formControlName="password" type="password" autocomplete="current-password" placeholder="••••••••"></div>
        <button class="btn btn-primary" [disabled]="form.invalid || loading">{{ loading ? 'Entrando...' : 'Entrar' }}</button>
        <a class="register-link" routerLink="/cadastro">Cadastrar usuário</a>
      </form>
    </section>
  `,
    styles: [`
      .login-page {
        min-height: 100vh;
        display: grid;
        grid-template-columns: 1.1fr 440px;
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
        font-size: clamp(40px, 6vw, 72px);
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

      .login-card {
        padding: 32px;
        display: grid;
        gap: 18px;
      }

      .login-card h2 {
        margin: 0;
        font-size: 32px;
      }

      .login-card p {
        margin: 0;
        color: var(--muted);
      }

      .login-card button {
        justify-content: center;
        margin-top: 4px;
      }

      .register-link {
        text-align: center;
        color: #2563eb;
        font-weight: 800;
        margin-top: 4px;
        text-decoration: none;
        display: inline-flex;
        justify-content: center;
      }

      .register-link:hover {
        color: #1d4ed8;
        text-decoration: underline;
      }

      @media (max-width: 900px) {
        .login-page {
          grid-template-columns: 1fr;
        }

        .hero h1 {
          font-size: 42px;
        }

        .login-card {
          margin-bottom: 24px;
        }
      }
    `]
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  loading = false;
  error = '';
  form = this.fb.nonNullable.group({ username: ['', Validators.required], password: ['', Validators.required] });

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => this.router.navigateByUrl('/dashboard'),
      error: () => { this.error = 'Não foi possível autenticar. Confira usuário, senha e client OAuth.'; this.loading = false; },
      complete: () => this.loading = false
    });
  }
}
