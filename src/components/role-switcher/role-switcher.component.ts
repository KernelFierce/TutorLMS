import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth.service';
import { UserRole } from '../../models';

@Component({
  selector: 'app-role-switcher',
  templateUrl: './role-switcher.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class RoleSwitcherComponent {
  authService = inject(AuthService);

  currentUser = this.authService.currentUser;
  activeRole = this.authService.activeRole;

  switchRole(role: UserRole): void {
    this.authService.switchRole(role);
  }
}
