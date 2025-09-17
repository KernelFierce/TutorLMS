import { Injectable, signal, computed } from '@angular/core';
import { User, UserRole } from './models';

// This is a global type declaration for the Google Identity Services client.
declare var google: any;

@Injectable({ providedIn: 'root' })
export class AuthService {
  // --- STATE SIGNALS ---
  currentUser = signal<User | null>(null);
  isAuthenticated = computed(() => !!this.currentUser());

  // --- CONFIGURATION (Replace with your actual credentials later) ---
  // 1. Get this from the Google Cloud Console after setting up OAuth 2.0
  private GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID';
  // 2. Get this from deploying your Google Apps Script as a Web App
  private WEB_APP_URL = 'YOUR_WEB_APP_URL';


  constructor() {
    // In a real app, you would initialize Google Sign-In here
    // this.initializeGoogleSignIn();
  }

  // --- PUBLIC API ---

  logout(): void {
    this.currentUser.set(null);
    // In a real app, you would also sign out from Google
    // google.accounts.id.disableAutoSelect();
  }

  // --- SIMULATION METHODS (for development and testing) ---

  /**
   * Simulates logging in as a specific role.
   * In a real application, this logic would be replaced by the
   * handleGoogleSignIn callback, which would verify the token
   * with the backend (Apps Script) to determine the user's role.
   */
  simulateLogin(role: UserRole): void {
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
  }


  // --- REAL GOOGLE SIGN-IN IMPLEMENTATION (for future reference) ---

  private initializeGoogleSignIn(): void {
    if (typeof google === 'undefined') {
        console.error("Google Identity Services script not loaded.");
        return;
    }
    
    google.accounts.id.initialize({
      client_id: this.GOOGLE_CLIENT_ID,
      callback: this.handleGoogleSignIn.bind(this),
      auto_select: true
    });
    
    google.accounts.id.prompt();
  }

  private async handleGoogleSignIn(response: any): Promise<void> {
    const idToken = response.credential;
    
    // In a real app, you would send this token to your backend (Google Apps Script)
    // to verify it and get the user's role and data.
    
    // Example POST request to your Apps Script Web App:
    /*
    const backendResponse = await fetch(this.WEB_APP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'verifyToken', token: idToken }),
    });

    const userData: User = await backendResponse.json();

    if (userData && userData.role) {
      this.currentUser.set(userData);
    } else {
      // Handle login failure (e.g., user not found in your system)
      console.error("Login failed: User not recognized by the backend.");
      this.currentUser.set(null);
    }
    */
   
    // For now, we'll just decode it on the client for demonstration
    const decodedToken: any = this.decodeJwt(idToken);
    const user: User = {
        name: decodedToken.name,
        email: decodedToken.email,
        picture: decodedToken.picture,
        role: 'Student', // This would come from your backend
        entityId: 'S-ABC123' // This would come from your backend
    };
    this.currentUser.set(user);
  }

  private decodeJwt(token: string): any {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
      return null;
    }
  }
}
