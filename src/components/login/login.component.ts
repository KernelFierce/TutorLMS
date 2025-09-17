import { Component, ChangeDetectionStrategy, inject, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth.service';
import { UserRole } from '../../models';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  // FIX: Corrected typo from 'Change' to 'ChangeDetectionStrategy'.
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule]
})
export class LoginComponent implements AfterViewInit {
  private authService = inject(AuthService);

  ngAfterViewInit(): void {
    // This triggers the rendering of the Google button by the AuthService
    // The authService is already trying to initialize, but this ensures it happens
    // after this component's view is ready.
    this.authService['initializeGoogleSignIn']();
  }

  loginAs(role: UserRole): void {
    this.authService.simulateLogin(role);
  }
}