import { Injectable, signal, computed } from '@angular/core';
import { User } from './models';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, User as FirebaseUser } from "firebase/auth";

@Injectable({ providedIn: 'root' })
export class AuthService {
  // --- STATE SIGNALS ---
  currentUser = signal<User | null>(null);
  isAuthenticated = computed(() => !!this.currentUser());

  private auth = getAuth();

  constructor() {
    onAuthStateChanged(this.auth, (user: FirebaseUser | null) => {
      if (user) {
        // For now, we'll use a simplified User object.
        // In a real app, you would fetch the user's role and other details from your database.
        const appUser: User = {
          name: user.displayName || 'User',
          email: user.email || '',
          role: 'Student', // Default role
        };
        this.currentUser.set(appUser);
      } else {
        this.currentUser.set(null);
      }
    });
  }

  // --- PUBLIC API ---

  async login(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(this.auth, email, password);
  }

  async register(email: string, password: string): Promise<void> {
    await createUserWithEmailAndPassword(this.auth, email, password);
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
  }
}