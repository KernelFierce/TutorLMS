import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule]
})
export class LoginComponent {
  private authService = inject(AuthService);

  email = signal('');
  password = signal('');

  async login(): Promise<void> {
    try {
      await this.authService.login(this.email(), this.password());
    } catch (error) {
      console.error('Login failed:', error);
      // Handle login error (e.g., show an error message)
    }
  }

  async register(): Promise<void> {
    try {
      await this.authService.register(this.email(), this.password());
    } catch (error) {
      console.error('Registration failed:', error);
      // Handle registration error
    }
  }
}