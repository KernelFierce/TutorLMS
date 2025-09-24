import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TutorDataService } from '../../tutor-data.service';
import { AuthService } from '../../auth.service';

interface TimeSlot {
  hour: number; // 0-23 in UTC
  label: string;
  status: 'available' | 'unavailable' | 'booked';
}

@Component({
  selector: 'app-availability-manager',
  templateUrl: './availability-manager.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class AvailabilityManagerComponent {
  private tutorService = inject(TutorDataService);
  private authService = inject(AuthService);

  private readonly today = new Date();
  
  // Generate the next 7 days for the calendar view
  weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(this.today);
    date.setDate(this.today.getDate() + i);
    return date;
  });

  timeSlots = computed(() => {
    const user = this.authService.currentUser();
    if (!user?.roles.includes('Teacher')) return [];

    const teacherId = user.id!;
    const availabilities = this.tutorService.teacherAvailability();
    const classes = this.tutorService.classes().filter(c => c.teacher.id === teacherId && c.status === 'Scheduled');
    
    // Create a lookup for booked slots
    const bookedSlots = new Map<string, Set<number>>();
    classes.forEach(c => {
        const key = new Date(c.start_time).toISOString().split('T')[0];
        const hour = new Date(c.start_time).getUTCHours();
        if (!bookedSlots.has(key)) {
            bookedSlots.set(key, new Set());
        }
        bookedSlots.get(key)!.add(hour);
    });

    // Create a lookup for available slots
    const availableSlots = new Map<string, Set<number>>();
    availabilities.forEach(a => {
        if (a.teacherId === teacherId) {
            // The model uses `ranges`, so we convert time ranges into a set of hours.
            const hours = new Set<number>();
            a.ranges.forEach(range => {
                const startHour = parseInt(range.startTime.split(':')[0], 10);
                const endHour = parseInt(range.endTime.split(':')[0], 10);
                for (let h = startHour; h < endHour; h++) {
                    hours.add(h);
                }
            });
            availableSlots.set(a.date, hours);
        }
    });

    return this.weekDays.map(date => {
      const dateString = date.toISOString().split('T')[0];
      const bookedHours = bookedSlots.get(dateString) || new Set();
      const availableHours = availableSlots.get(dateString) || new Set();
      
      const slots = Array.from({ length: 24 }, (_, hour) => {
        const utcDateTime = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), hour));
        const userTimeZone = this.tutorService.teachers().find(t=>t.id === teacherId)?.time_zone || 'UTC';
        const label = utcDateTime.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true, timeZone: userTimeZone });
        
        let status: 'available' | 'unavailable' | 'booked' = 'unavailable';
        if (bookedHours.has(hour)) {
          status = 'booked';
        } else if (availableHours.has(hour)) {
          status = 'available';
        }

        return { hour, label, status };
      });

      return {
        date,
        dateString,
        slots,
      };
    });
  });

  toggleAvailability(dateString: string, slot: TimeSlot): void {
    if (slot.status === 'booked') return;

    const user = this.authService.currentUser();
    if (!user?.roles.includes('Teacher')) return;
    
    const isAvailable = slot.status !== 'available';
    // Create a one-hour range object for the toggled slot.
    const startHour = slot.hour.toString().padStart(2, '0');
    const endHour = (slot.hour + 1).toString().padStart(2, '0');
    const range = { startTime: `${startHour}:00`, endTime: `${endHour}:00` };
    // this.tutorService.setAvailability(user.id!, dateString, range, isAvailable);
  }
}