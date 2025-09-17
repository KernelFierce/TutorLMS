import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from './auth.service';
import { LoginComponent } from './components/login/login.component';
import { AdminPortalComponent } from './components/admin-portal/admin-portal.component';
import { TeacherPortalComponent } from './components/teacher-portal/teacher-portal.component';
import { StudentPortalComponent } from './components/student-portal/student-portal.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    LoginComponent,
    AdminPortalComponent,
    TeacherPortalComponent,
    StudentPortalComponent
  ],
})
export class AppComponent {
  authService = inject(AuthService);

  // Expose signals from AuthService to the template
  isAuthenticated = this.authService.isAuthenticated;
  currentUser = this.authService.currentUser;

  logout(): void {
    this.authService.logout();
  }
}