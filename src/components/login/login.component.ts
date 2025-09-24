import { Component, ChangeDetectionStrategy, inject, signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth.service';
import { FormsModule } from '@angular/forms';
import { User } from '../../models';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule]
})
export class LoginComponent {
  private authService = inject(AuthService);

  @Output() showSignup = new EventEmitter<void>();
  
  email = signal('');
  password = signal('');
  
  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);

  async onLogin(): Promise<void> {
    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    
    const result = await this.authService.login(this.email(), this.password());
    
    if (!result.success) {
      this.errorMessage.set(result.message);
    }
    // On success, the onAuthStateChange listener in AuthService will handle everything else.
    
    this.isSubmitting.set(false);
  }

  onShowSignup(): void {
    this.showSignup.emit();
  }
}
