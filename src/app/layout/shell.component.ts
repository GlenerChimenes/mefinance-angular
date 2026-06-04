import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { TokenService } from '../core/services/token.service';
import { SessionTimeoutService } from '../core/services/session-timeout.service';

@Component({
    selector: 'app-shell',
    standalone: true,
    imports: [RouterOutlet, RouterLink, RouterLinkActive],
    template: `
        <aside class="sidebar">
            <div class="brand">
                <span>{{ initials }}</span>

                <div>
                    <strong>{{ username || 'Usuário' }}</strong>
                    <small>Controle financeiro</small>
                </div>
            </div>

            <nav>
                <a routerLink="/dashboard" routerLinkActive="active">Dashboard</a>
                <a routerLink="/gastos" routerLinkActive="active">Gastos</a>
                <a routerLink="/ver-gastos" routerLinkActive="active">Ver gastos</a>
            </nav>

            <button class="btn btn-secondary" (click)="logout()">Sair</button>
        </aside>

        <main class="main">
            <router-outlet />
        </main>
        @if (session.showWarning()) {
            <div class="session-backdrop">
                <div class="session-modal">
                    <div class="session-icon">⏳</div>

                    <h2>Sua sessão vai expirar</h2>

                    <p>
                        Por segurança, sua sessão será encerrada em
                        <strong>{{ session.remainingSeconds() }}</strong>
                        segundo(s).
                    </p>

                    <button class="btn btn-primary" (click)="continuarSessao()">
                        Continuar sessão
                    </button>
                </div>
            </div>
        }
    `,
    styles: [`
      :host {
        min-height: 100vh;
        display: grid;
        grid-template-columns: 280px 1fr;
      }

      .sidebar {
        position: sticky;
        top: 0;
        height: 100vh;
        padding: 28px;
        background: rgba(255, 255, 255, .74);
        border-right: 1px solid rgba(255, 255, 255, .8);
        backdrop-filter: blur(18px);
        display: flex;
        flex-direction: column;
        gap: 28px;
      }

      .brand {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .brand span {
        width: 48px;
        height: 48px;
        border-radius: 18px;
        background: linear-gradient(135deg, #2563eb, #7c3aed);
        color: white;
        display: grid;
        place-items: center;
        font-weight: 900;
      }

      .brand strong {
        display: block;
        font-size: 19px;
      }

      .brand small {
        color: var(--muted);
      }

      nav {
        display: grid;
        gap: 10px;
      }

      nav a {
        padding: 14px 16px;
        border-radius: 16px;
        color: #475569;
        font-weight: 700;
      }

      .active,
      nav a:hover {
        background: #eef2ff;
        color: #3730a3;
      }

      .main {
        padding: 34px 0 64px;
      }

      .session-backdrop {
        position: fixed;
        inset: 0;
        z-index: 9999;
        background: rgba(15, 23, 42, .55);
        backdrop-filter: blur(8px);
        display: grid;
        place-items: center;
        padding: 20px;
      }

      .session-modal {
        width: min(420px, 100%);
        background: white;
        border-radius: 28px;
        padding: 34px;
        text-align: center;
        box-shadow: 0 30px 80px rgba(15, 23, 42, .35);
        animation: sessionPop .22s ease-out;
      }

      .session-icon {
        width: 70px;
        height: 70px;
        margin: 0 auto 18px;
        border-radius: 24px;
        background: linear-gradient(135deg, #2563eb, #7c3aed);
        color: white;
        display: grid;
        place-items: center;
        font-size: 34px;
      }

      .session-modal h2 {
        margin: 0 0 10px;
        font-size: 28px;
        color: #0f172a;
      }

      .session-modal p {
        margin: 0 0 24px;
        color: #64748b;
        line-height: 1.5;
      }

      .session-modal strong {
        color: #dc2626;
        font-size: 22px;
      }

      .session-modal button {
        width: 100%;
        justify-content: center;
      }

      @keyframes sessionPop {
        from {
          opacity: 0;
          transform: translateY(12px) scale(.96);
        }

        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      @media (max-width: 800px) {
        :host {
          display: block;
        }

        .sidebar {
          height: auto;
          position: relative;
          padding: 18px;
          gap: 14px;
        }

        .main {
          padding: 20px 0;
        }

        .brand small {
          display: none;
        }

        nav {
          grid-template-columns: 1fr 1fr;
        }

        .sidebar button {
          width: 100%;
          justify-content: center;
        }
      }
    `]
})
export class ShellComponent implements OnInit, OnDestroy {
    private readonly auth = inject(AuthService);
    private readonly router = inject(Router);
    private readonly tokenService = inject(TokenService);
    private readonly sessionTimeoutService = inject(SessionTimeoutService);

    readonly session = this.sessionTimeoutService;

    username = this.formatUsername(this.tokenService.getUsername());
    initials = this.getInitials(this.username);

    ngOnInit(): void {
        this.sessionTimeoutService.start();
    }

    ngOnDestroy(): void {
        this.sessionTimeoutService.stop();
    }

    logout(): void {
        this.sessionTimeoutService.stop();
        this.auth.logout();
        this.router.navigateByUrl('/login');
    }

    continuarSessao(): void {
        this.sessionTimeoutService.continueSession();
    }

    private formatUsername(username: string | null): string {
        if (!username) {
            return 'Usuário';
        }

        if (username.includes('@')) {
            return username.split('@')[0];
        }

        return username;
    }

    private getInitials(name: string): string {
        if (!name || name === 'Usuário') {
            return 'US';
        }

        return name
            .split(/[.\s_-]+/)
            .filter(Boolean)
            .slice(0, 2)
            .map(part => part.charAt(0).toUpperCase())
            .join('');
    }
}