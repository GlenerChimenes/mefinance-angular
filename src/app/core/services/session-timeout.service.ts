import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { fromEvent, merge, Subscription, timer } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class SessionTimeoutService {
    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);

    private activitySubscription?: Subscription;
    private countdownInterval?: ReturnType<typeof setInterval>;

    private readonly idleTimeMs = 5 * 60 * 1000;
    private readonly warningSeconds = 30;

    showWarning = signal(false);
    remainingSeconds = signal(this.warningSeconds);

    start(): void {
        this.stop();

        const userEvents$ = merge(
            fromEvent(document, 'mousemove'),
            fromEvent(document, 'mousedown'),
            fromEvent(document, 'keydown'),
            fromEvent(document, 'scroll'),
            fromEvent(document, 'touchstart')
        );

        this.activitySubscription = userEvents$
            .pipe(
                startWith(null),
                switchMap(() => timer(this.idleTimeMs))
            )
            .subscribe(() => {
                this.startCountdown();
            });
    }

    stop(): void {
        this.activitySubscription?.unsubscribe();
        this.activitySubscription = undefined;

        this.clearCountdown();
        this.hideWarning();
    }

    continueSession(): void {
        this.clearCountdown();
        this.hideWarning();
        this.start();
    }

    private startCountdown(): void {
        // Quando o modal aparece, para de escutar mouse/teclado.
        // A sessão só continua se clicar no botão "Continuar sessão".
        this.activitySubscription?.unsubscribe();
        this.activitySubscription = undefined;

        this.showWarning.set(true);
        this.remainingSeconds.set(this.warningSeconds);

        this.clearCountdown();

        this.countdownInterval = setInterval(() => {
            const current = this.remainingSeconds();

            if (current <= 1) {
                this.logoutPorInatividade();
                return;
            }

            this.remainingSeconds.set(current - 1);
        }, 1000);
    }

    private clearCountdown(): void {
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = undefined;
        }
    }

    private hideWarning(): void {
        this.showWarning.set(false);
        this.remainingSeconds.set(this.warningSeconds);
    }

    private logoutPorInatividade(): void {
        this.clearCountdown();
        this.hideWarning();
        this.authService.logout();
        this.router.navigateByUrl('/login');
    }
}