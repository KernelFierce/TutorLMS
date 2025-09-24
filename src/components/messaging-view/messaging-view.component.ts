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

  activeConversationId = signal<number | null>(null);
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
      .filter(m => m.conversation_id === activeId)
      .sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  });
  
  constructor() {
    effect(() => {
        const user = this.currentUser();
        const convos = this.conversations();
        if (user && user.roles[0] !== 'Student' && convos.length > 0 && !this.activeConversationId()) {
            this.activeConversationId.set(convos[0].id);
        } else if (user && user.roles[0] === 'Student' && convos.length > 0) {
            this.activeConversationId.set(convos[0].id);
        }
    });

    effect(() => {
      this.currentMessages();
      setTimeout(() => this.scrollToBottom(), 0);
    });
  }

  ngAfterViewInit() {
    this.scrollToBottom();
  }

  selectConversation(convoId: number): void {
    this.activeConversationId.set(convoId);
  }

  async sendMessage(): Promise<void> {
    const convoId = this.activeConversationId();
    const text = this.newMessage().trim();
    if (convoId && text) {
      await this.tutorService.sendMessage(convoId, text);
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
