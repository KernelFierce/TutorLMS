import { Component, ChangeDetectionStrategy, inject, signal, computed, effect, AfterViewInit, ElementRef, viewChild } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../data.service';
import { AuthService } from '../../auth.service';
import { Message, Conversation } from '../../models'; // Assuming Conversation will be defined in the new model

@Component({
  selector: 'app-messaging-view',
  templateUrl: './messaging-view.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  providers: [DatePipe]
})
export class MessagingViewComponent implements AfterViewInit {
  private dataService = inject(DataService);
  private authService = inject(AuthService);
  private scrollContainer = viewChild<ElementRef<HTMLDivElement>>('scrollContainer');

  currentUser = this.authService.currentUser;
  
  // TODO: Implement conversations signal in DataService
  conversations = signal<Conversation[]>([]); 
  
  // TODO: Implement messages signal in DataService
  allMessages = signal<Message[]>([]);

  activeConversationId = signal<string | null>(null);
  newMessage = signal('');

  activeConversation = computed<Conversation | undefined>(() => {
    const activeId = this.activeConversationId();
    if (!activeId) return undefined;
    return this.conversations().find(c => c.id === activeId);
  });

  currentMessages = computed(() => {
    const activeId = this.activeConversationId();
    if (!activeId) return [];
    // TODO: Enrich messages with sender name and isCurrentUser flag
    return this.allMessages()
      .filter(m => m.conversationId === activeId)
      .sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  });
  
  constructor() {
    effect(() => {
        const user = this.currentUser();
        const convos = this.conversations();
        if (user && user.role !== 'Student' && convos.length > 0 && !this.activeConversationId()) {
            this.activeConversationId.set(convos[0].id);
        } else if (user && user.role === 'Student' && convos.length > 0) {
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

  selectConversation(convoId: string): void {
    this.activeConversationId.set(convoId);
  }

  sendMessage(): void {
    const convoId = this.activeConversationId();
    const text = this.newMessage().trim();
    if (convoId && text) {
      // TODO: Implement sendMessage in DataService
      // this.dataService.sendMessage(convoId, text);
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
