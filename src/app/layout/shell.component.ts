import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { TokenService } from '../core/services/token.service';

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
            </nav>

            <button class="btn btn-secondary" (click)="logout()">Sair</button>
        </aside>

        <main class="main">
            <router-outlet />
        </main>
    `,
    styles: [`
      :host{min-height:100vh;display:grid;grid-template-columns:280px 1fr}.sidebar{position:sticky;top:0;height:100vh;padding:28px;background:rgba(255,255,255,.74);border-right:1px solid rgba(255,255,255,.8);backdrop-filter:blur(18px);display:flex;flex-direction:column;gap:28px}.brand{display:flex;align-items:center;gap:12px}.brand span{width:48px;height:48px;border-radius:18px;background:linear-gradient(135deg,#2563eb,#7c3aed);color:white;display:grid;place-items:center;font-weight:900}.brand strong{display:block;font-size:19px}.brand small{color:var(--muted)}nav{display:grid;gap:10px}nav a{padding:14px 16px;border-radius:16px;color:#475569;font-weight:700}.active,nav a:hover{background:#eef2ff;color:#3730a3}.main{padding:34px 0 64px}@media(max-width:800px){:host{display:block}.sidebar{height:auto;position:relative;padding:18px;gap:14px}.main{padding:20px 0}.brand small{display:none}nav{grid-template-columns:1fr 1fr}.sidebar button{width:100%;justify-content:center}}
    `]
})
export class ShellComponent {
    private readonly auth = inject(AuthService);
    private readonly router = inject(Router);
    private readonly tokenService = inject(TokenService);

    username = this.formatUsername(this.tokenService.getUsername());

    initials = this.getInitials(this.username);

    logout(): void {
        this.auth.logout();
        this.router.navigateByUrl('/login');
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