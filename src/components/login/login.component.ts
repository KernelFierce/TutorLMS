import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../supabase.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule]
})
export class LoginComponent {
  private supabaseService = inject(SupabaseService);

  email = signal('');
  password = signal('');

  async login(): Promise<void> {
    try {
      await this.supabaseService.login(this.email(), this.password());
    } catch (error) {
      console.error('Login failed:', error);
      // Handle login error (e.g., show an error message)
    }
  }

  async register(): Promise<void> {
    try {
      await this.supabaseService.register(this.email(), this.password());
    } catch (error) {
      console.error('Registration failed:', error);
      // Handle registration error
    }
  }
}