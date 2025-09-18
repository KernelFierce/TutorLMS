import { Injectable, signal, computed } from '@angular/core';
import { createClient, SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js';
import { environment } from '../environments/environment';
// NOTE: The models in `./models.ts` will also need to be updated to match the new schema.
// For example, IDs should be strings (UUIDs), and new models like `Message` will be needed.
import {
    Student, Teacher, Course as Class, Assignment, User, Message, Organization, Admin
} from './models';

@Injectable({
    providedIn: 'root'
})
export class SupabaseService {
    private supabase: SupabaseClient;

    // --- STATE SIGNALS (aligned with new schema) ---
    currentUser = signal<User | null>(null);
    isAuthenticated = computed(() => !!this.currentUser());
    
    admins = signal<Admin[]>([]);
    teachers = signal<Teacher[]>([]);
    students = signal<Student[]>([]);
    classes = signal<Class[]>([]);
    assignments = signal<Assignment[]>([]);
    messages = signal<Message[]>([]);

    constructor() {
        this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

        this.supabase.auth.onAuthStateChange((event, session) => {
            const user = session?.user || null;
            this.fetchAndSetUser(user);
        });
    }

    // --- AUTHENTICATION ---

    async login(email: string, password: string): Promise<void> {
        const { error } = await this.supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
    }

    async register(email: string, password: string): Promise<void> {
        // NOTE: In a multi-tenant app, registration is complex. 
        // A user needs an `org_id`. This often happens via an invite flow.
        // A simple `signUp` requires a backend trigger to populate the `users` table correctly.
        const { error } = await this.supabase.auth.signUp({ email, password });
        if (error) throw error;
    }

    async logout(): Promise<void> {
        const { error } = await this.supabase.auth.signOut();
        if (error) throw error;
        // Clear all local state on logout
        this.currentUser.set(null);
        this.admins.set([]);
        this.teachers.set([]);
        this.students.set([]);
        this.classes.set([]);
        this.assignments.set([]);
        this.messages.set([]);
    }

    private async fetchAndSetUser(user: SupabaseUser | null) {
        if (user) {
            // Fetch the user's profile from the 'users' table using the auth_uid
            const { data, error } = await this.supabase
                .from('users')
                .select('*, organizations(*)') // Also fetch the organization info
                .eq('auth_uid', user.id)
                .single();

            if (error || !data) {
                console.error('Error fetching user profile:', error);
                this.currentUser.set(null);
                return;
            }
            
            this.currentUser.set(data as User);
            // Once user is fetched, load the rest of the data for their organization
            this.loadInitialData();
        } else {
            this.currentUser.set(null);
        }
    }

    // --- DATA FETCHING ---

    async loadInitialData() {
        if (!this.currentUser()?.org_id) return;

        // RLS policies will automatically filter data by the user's organization.
        const [
            admins, teachers, students, classes, assignments, messages
        ] = await Promise.all([
            this.supabase.from('admins').select('*'),
            this.supabase.from('teachers').select('*'),
            this.supabase.from('students').select('*'),
            this.supabase.from('classes').select('*'),
            this.supabase.from('assignments').select('*'),
            this.supabase.from('messages').select('*'),
        ]);

        this.admins.set(admins.data || []);
        this.teachers.set(teachers.data || []);
        this.students.set(students.data || []);
        this.classes.set(classes.data || []);
        this.assignments.set(assignments.data || []);
        this.messages.set(messages.data || []);
    }

    // --- DATA MODIFICATION EXAMPLES ---

    async scheduleClass(classData: Partial<Class>) {
        const org_id = this.currentUser()?.org_id;
        if (!org_id) throw new Error("User has no organization.");
        
        const { data, error } = await this.supabase
            .from('classes')
            .insert({ ...classData, org_id: org_id })
            .select()
            .single();
            
        if (error) throw error;
        
        this.classes.update(current => [...current, data as Class]);
    }

    async updateStudentStatus(studentId: string, newStatus: string) {
        const { data, error } = await this.supabase
            .from('students')
            .update({ account_status: newStatus })
            .eq('id', studentId)
            .select()
            .single();

        if (error) throw error;

        this.students.update(students => 
            students.map(s => s.id === studentId ? data as Student : s)
        );
    }

    async sendMessage(content: string, recipient_id: string, class_id?: string) {
        const sender_id = this.currentUser()?.id;
        const org_id = this.currentUser()?.org_id;
        if (!sender_id || !org_id) throw new Error("User not properly loaded.");

        const { data, error } = await this.supabase
            .from('messages')
            .insert({ content, recipient_id, sender_id, class_id, org_id })
            .select()
            .single();
        
        if (error) throw error;

        this.messages.update(current => [...current, data as Message]);
    }
}
