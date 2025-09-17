import { Injectable, signal, computed } from '@angular/core';
import { User, UserRole } from './models';

// This is a global type declaration for the Google Identity Services client.
declare var google: any;

@Injectable({ providedIn: 'root' })
export class AuthService {
  // --- STATE SIGNALS ---
  currentUser = signal<User | null>(null);
  isAuthenticated = computed(() => !!this.currentUser());

  // --- CONFIGURATION ---
  // IMPORTANT: Paste the Client ID you created in the Google Cloud Console here.
  private GOOGLE_CLIENT_ID = 'PASTE_YOUR_GOOGLE_CLIENT_ID_HERE';


  constructor() {
    // When the app starts, initialize Google Sign-In
    this.initializeGoogleSignIn();
  }

  // --- PUBLIC API ---

  logout(): void {
    this.currentUser.set(null);
    // When logging out, also disable Google's automatic sign-in for the next visit.
    if (typeof google !== 'undefined') {
        google.accounts.id.disableAutoSelect();
    }
  }

  // --- SIMULATION METHODS (for development) ---

  /**
   * Simulates logging in as a specific role. This is for development purposes.
   */
  simulateLogin(role: UserRole): void {
    if (this.GOOGLE_CLIENT_ID.startsWith('PASTE_YOUR')) {
        let user: User | null = null;
        switch(role) {
          case 'Admin':
            user = { name: 'Admin User', email: 'admin@example.com', role: 'Admin' };
            break;
          case 'Teacher':
            // Log in as the first teacher in our mock data
            user = { name: 'John Smith', email: 'teacher.john@example.com', role: 'Teacher', entityId: 'T-JSM45' };
            break;
          case 'Student':
             // Log in as the first student in our mock data
            user = { name: 'Charlie Brown', email: 'student.charlie@example.com', role: 'Student', entityId: 'S-ABC123' };
            break;
        }
        this.currentUser.set(user);
    } else {
        // If a real client ID is configured, prompt for real sign-in
        google.accounts.id.prompt();
    }
  }


  // --- REAL GOOGLE SIGN-IN IMPLEMENTATION ---

  private initializeGoogleSignIn(): void {
    if (this.GOOGLE_CLIENT_ID.startsWith('PASTE_YOUR')) {
        console.warn('Google Client ID is not configured. Google Sign-In is disabled.');
        return;
    }
    
    if (typeof google === 'undefined' || typeof google.accounts === 'undefined') {
        console.error("Google Identity Services script not loaded. Cannot initialize Sign-In.");
        // Optionally, you could retry after a short delay
        // setTimeout(() => this.initializeGoogleSignIn(), 1000);
        return;
    }
    
    google.accounts.id.initialize({
      client_id: this.GOOGLE_CLIENT_ID,
      callback: this.handleGoogleSignIn.bind(this),
      auto_select: false // Set to false to always show the prompt on first visit
    });
    
    // This renders the "Sign in with Google" button.
    // We will place a div with id="googleSignInButton" in the login component.
    const signInButton = document.getElementById('googleSignInButton');
    if (signInButton) {
      google.accounts.id.renderButton(
          signInButton,
          { theme: 'outline', size: 'large', width: '300' } 
      );
    }
    
    // This will automatically prompt the user to sign in on subsequent visits if they haven't logged out.
    google.accounts.id.prompt();
  }

  private handleGoogleSignIn(response: any): void {
    const idToken = response.credential;
    const decodedToken: any = this.decodeJwt(idToken);
    
    // IMPORTANT: This is a simplified login for a frontend-only app.
    // We check the email address to determine the role. In a real-world
    // app with a backend, your server would verify the token and return the user's role.
    let role: UserRole = 'Student'; // Default role
    let entityId: string | undefined = undefined;

    if (decodedToken.email === 'admin@example.com') { // Your admin's email
        role = 'Admin';
    } else if (decodedToken.email === 'teacher.john@example.com') { // Example teacher email
        role = 'Teacher';
        entityId = 'T-JSM45';
    } else if (decodedToken.email === 'student.charlie@example.com') { // Example student email
        role = 'Student';
        entityId = 'S-ABC123';
    } else {
        // For any other Google account, we'll log them in as a default student for now.
        role = 'Student';
        entityId = 'S-DEF456'; // A generic student ID for unrecognized users.
    }
    
    const user: User = {
        name: decodedToken.name,
        email: decodedToken.email,
        picture: decodedToken.picture,
        role: role,
        entityId: entityId
    };

    this.currentUser.set(user);
  }

  private decodeJwt(token: string): any {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
      console.error('Error decoding JWT', e);
      return null;
    }
  }
}