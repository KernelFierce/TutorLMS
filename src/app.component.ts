import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from './supabase.service';
import { LoginComponent } from './components/login/login.component';
import { AdminPortalComponent } from './components/admin-portal/admin-portal.component';
import { TeacherPortalComponent } from './components/teacher-portal/teacher-portal.component';
import { StudentPortalComponent } from './components/student-portal/student-portal.component';

@Component({
  selector: 'app-root',
  standalone: true,
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
  supabaseService = inject(SupabaseService);

  // Expose signals from SupabaseService to the template
  isAuthenticated = this.supabaseService.isAuthenticated;
  currentUser = this.supabaseService.currentUser;

  async logout(): Promise<void> {
    await this.supabaseService.logout();
  }
}