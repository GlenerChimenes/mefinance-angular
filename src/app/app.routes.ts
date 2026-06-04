import { Routes } from '@angular/router';
import { authGuard } from './core/services/auth.guard';
import { LoginComponent } from './pages/login/login.component';
import { ShellComponent } from './layout/shell.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ExpensesComponent } from './pages/expenses/expenses.component';
import { RegisterComponent } from './pages/register/register.component';
import { ExpenseSearchComponent } from './pages/expense-search/expense-search.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'cadastro', component: RegisterComponent },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'gastos', component: ExpensesComponent },
      { path: 'ver-gastos', component: ExpenseSearchComponent }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
