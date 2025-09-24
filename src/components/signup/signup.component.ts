import { Component, ChangeDetectionStrategy, inject, signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
})
export class SignupComponent {
  private authService = inject(AuthService);

  @Output() showLogin = new EventEmitter<void>();

  model = signal({
    organizationName: '',
    adminName: '',
    adminEmail: '',
    password: '',
  });

  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  async handleSignup(): Promise<void> {
    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    
    const { organizationName, adminName, adminEmail, password } = this.model();
    
    if (!organizationName || !adminName || !adminEmail || !password) {
        this.errorMessage.set('Please fill out all fields.');
        this.isSubmitting.set(false);
        return;
    }

    try {
      const result = await this.authService.signUp(organizationName, adminName, adminEmail, password);
      
      if (result.success) {
        this.successMessage.set(result.message);
      } else {
        this.errorMessage.set(result.message);
      }
      
    } catch (error: any) {
      this.errorMessage.set(error.message || 'An unknown error occurred during signup.');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  onShowLogin(): void {
    this.showLogin.emit();
  }
}
