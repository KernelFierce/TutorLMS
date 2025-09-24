import { Component, ChangeDetectionStrategy, inject, effect, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from './auth.service';
import { LoginComponent } from './components/login/login.component';
import { AdminPortalComponent } from './components/admin-portal/admin-portal.component';
import { TeacherPortalComponent } from './components/teacher-portal/teacher-portal.component';
import { StudentPortalComponent } from './components/student-portal/student-portal.component';
import { ParentPortalComponent } from './components/parent-portal/parent-portal.component';
import { SignupComponent } from './components/signup/signup.component';
import { TutorDataService } from './tutor-data.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    LoginComponent,
    AdminPortalComponent,
    TeacherPortalComponent,
    StudentPortalComponent,
    ParentPortalComponent,
    SignupComponent
  ],
})
export class AppComponent {
  authService = inject(AuthService);
  tutorService = inject(TutorDataService);

  // Expose signals to the template
  isAuthenticated = this.authService.isAuthenticated;
  currentUser = this.authService.currentUser;
  primaryRole = this.authService.primaryRole;
  isLoading = computed(() => this.authService.authLoading() || this.tutorService.isLoading());

  view = signal<'login' | 'signup'>('login');

  constructor() {
    // When the user logs in, fetch the data.
    effect(() => {
      if (this.isAuthenticated()) {
        this.tutorService.initializeData();
        this.view.set('login'); // Reset to login view on auth change
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }
}