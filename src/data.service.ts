import { Injectable, signal } from '@angular/core';
import { Student, Teacher, Course, Attendance } from './models';
import { getFirestore, collection, getDocs } from "firebase/firestore";  

@Injectable({ providedIn: 'root' })
export class DataService {
    private db = getFirestore();

    // --- STATE SIGNALS ---
    students = signal<Student[]>([]);
    teachers = signal<Teacher[]>([]);
    courses = signal<Course[]>([]);
    attendance = signal<Attendance[]>([]);

    constructor() {
        this.loadInitialData();
    }

    async loadInitialData() {
        // For now, we'll load data from Firestore.
        // In a real app, you would implement more sophisticated data fetching and caching strategies.

        const studentsCollection = collection(this.db, "students");
        const studentSnapshot = await getDocs(studentsCollection);
        this.students.set(studentSnapshot.docs.map(doc => doc.data() as Student));

        const teachersCollection = collection(this.db, "teachers");
        const teacherSnapshot = await getDocs(teachersCollection);
        this.teachers.set(teacherSnapshot.docs.map(doc => doc.data() as Teacher));

        const coursesCollection = collection(this.db, "courses");
        const courseSnapshot = await getDocs(coursesCollection);
        this.courses.set(courseSnapshot.docs.map(doc => doc.data() as Course));

        const attendanceCollection = collection(this.db, "attendance");
        const attendanceSnapshot = await getDocs(attendanceCollection);
        this.attendance.set(attendanceSnapshot.docs.map(doc => doc.data() as Attendance));
    }
}