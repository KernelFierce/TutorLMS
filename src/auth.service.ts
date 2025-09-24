import { Injectable, signal, computed, inject } from '@angular/core';
import { User, UserRole } from './models';
import { SupabaseService } from './supabase.service';
import { AuthSession } from '@supabase/supabase-js';

const roleHierarchy: UserRole[] = ['SuperAdmin', 'OrganizationAdmin', 'Admin', 'Teacher', 'Parent', 'Student'];

@Injectable({ providedIn: 'root' })
export class AuthService {
  private supabaseService = inject(SupabaseService);
  
  // --- STATE SIGNALS ---
  currentUser = signal<User | null>(null);
  authLoading = signal(true);
  isAuthenticated = computed(() => !!this.currentUser());
  activeRole = signal<UserRole | null>(null);

  primaryRole = computed<UserRole | undefined>(() => {
    return this.activeRole() ?? undefined;
  });

  constructor() {
    this.supabaseService.getClient().auth.onAuthStateChange(async (event, session) => {
        if (session && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
            await this.loadUserProfile(session);
        } else if (event === 'SIGNED_OUT' || (event === 'INITIAL_SESSION' && !session)) {
            this.handleLogoutState();
        }
        this.authLoading.set(false);
    });
  }

  private async loadUserProfile(session: AuthSession | null): Promise<void> {
      if (!session) {
          this.handleLogoutState();
          return;
      }
      
      // The roles and organization_id are now in the JWT claims (app_metadata)
      // thanks to our Auth Hook. This is faster and more reliable.
      const roles = session.user.app_metadata?.roles || [];
      const organization_id = session.user.app_metadata?.organization_id || null;

      if (roles.length === 0) {
          console.error("User has no roles assigned in JWT claims. Please check user_roles table.");
          await this.logout();
          return;
      }

      // We still need to fetch the rest of the profile from the `people` table.
      const client = this.supabaseService.getClient();
      const { data: personDetails, error: personError } = await client
        .from('people')
        .select('*')
        .eq('id', session.user.id)
        .single();
        
      if (personError || !personDetails) {
        console.error('Failed to fetch user profile details from "people" table:', personError);
        await this.logout();
        return;
      }
      
      const userProfile: User = {
        id: personDetails.id,
        organization_id: organization_id, // Use the org_id from the JWT
        full_name: personDetails.full_name,
        email: personDetails.email,
        avatar_url: personDetails.avatar_url,
        roles: roles, // Use the roles from the JWT
        is_active: personDetails.is_active,
        time_zone: personDetails.time_zone
      };

      this.currentUser.set(userProfile);

      // Set initial active role to the highest privilege
      const highestRole = userProfile.roles.slice().sort((a, b) => {
        return roleHierarchy.indexOf(a) - roleHierarchy.indexOf(b);
      })[0];
      this.activeRole.set(highestRole);
  }

  async login(email: string, password: string): Promise<{ success: boolean; message: string }> {
      const { error } = await this.supabaseService.getClient().auth.signInWithPassword({ email, password });
      if (error) {
          return { success: false, message: error.message };
      }
      return { success: true, message: 'Login successful' };
  }

  async signUp(orgName: string, adminName: string, adminEmail: string, adminPass: string): Promise<{ success: boolean; message: string }> {
      try {
          await this.supabaseService.createOrganization(orgName, adminName, adminEmail, adminPass);
          return { success: true, message: 'Sign-up successful! Please check your email for a confirmation link.' };
      } catch (error: any) {
          return { success: false, message: error.message || 'An unknown error occurred during signup.' };
      }
  }

  switchRole(role: UserRole): void {
      const user = this.currentUser();
      if (user && user.roles.includes(role)) {
          this.activeRole.set(role);
      }
  }

  async logout(): Promise<void> {
    const { error } = await this.supabaseService.getClient().auth.signOut();
    if (error) {
        console.error('Error signing out:', error);
    }
    // The onAuthStateChange listener will call handleLogoutState
  }
  
  private handleLogoutState(): void {
    this.currentUser.set(null);
    this.activeRole.set(null);
    // Add any other state cleanup here
  }
}
