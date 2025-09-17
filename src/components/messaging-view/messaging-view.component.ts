import { Component, ChangeDetectionStrategy, inject, signal, computed, effect, AfterViewInit, ElementRef, viewChild } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TutorDataService } from '../../tutor-data.service';
import { AuthService } from '../../auth.service';
import { Conversation, EnrichedMessage } from '../../models';

@Component({
  selector: 'app-messaging-view',
  templateUrl: './messaging-view.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  providers: [DatePipe]
})
export class MessagingViewComponent implements AfterViewInit {
  private tutorService = inject(TutorDataService);
  private authService = inject(AuthService);
  private scrollContainer = viewChild<ElementRef<HTMLDivElement>>('scrollContainer');

  currentUser = this.authService.currentUser;
  conversations = this.tutorService.conversationsForCurrentUser;
  allMessages = this.tutorService.allMessagesEnriched;

  activeConversationId = signal<string | null>(null);
  newMessage = signal('');

  activeConversation = computed<Conversation | undefined>(() => {
    const activeId = this.activeConversationId();
    if (!activeId) return undefined;
    return this.conversations().find(c => c.id === activeId);
  });

  currentMessages = computed<EnrichedMessage[]>(() => {
    const activeId = this.activeConversationId();
    if (!activeId) return [];
    return this.allMessages()
      .filter(m => m.conversationId === activeId)
      .sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  });
  
  constructor() {
    // Automatically select the first conversation for non-student roles
    effect(() => {
        const user = this.currentUser();
        const convos = this.conversations();
        if (user && user.role !== 'Student' && convos.length > 0 && !this.activeConversationId()) {
            this.activeConversationId.set(convos[0].id);
        } else if (user && user.role === 'Student' && convos.length > 0) {
            this.activeConversationId.set(convos[0].id);
        }
    });

    // Effect to scroll to the bottom when new messages are added
    effect(() => {
      // Triggered when currentMessages changes
      this.currentMessages();
      // Use a timeout to allow the DOM to update before scrolling
      setTimeout(() => this.scrollToBottom(), 0);
    });
  }

  ngAfterViewInit() {
    this.scrollToBottom();
  }

  selectConversation(convoId: string): void {
    this.activeConversationId.set(convoId);
  }

  sendMessage(): void {
    const convoId = this.activeConversationId();
    const text = this.newMessage().trim();
    if (convoId && text) {
      this.tutorService.sendMessage(convoId, text);
      this.newMessage.set('');
    }
  }

  private scrollToBottom(): void {
    const container = this.scrollContainer()?.nativeElement;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }
}
