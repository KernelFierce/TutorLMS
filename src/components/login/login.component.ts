import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth.service';
import { UserRole } from '../../models';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule]
})
export class LoginComponent {
  private authService = inject(AuthService);

  loginAs(role: UserRole): void {
    this.authService.simulateLogin(role);
  }
}
