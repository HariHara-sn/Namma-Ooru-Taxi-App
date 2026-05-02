import { create } from 'zustand';
import supportData from '../sample/supportData.json';
import UserTicketService from '../services/UserTicketService';  
import { convertToRelativeTime } from '../../../utils/Utils';
import { utils } from '../../../utils/Utils';
import useUserInfoStore from '../../../../common/store/useUserInfoStore';
const useSupportStore = create((set, get) => ({
  // State
  tickets: [],
  categories: [],
  priorities: [],
  selectedTicket: null,
  isLoading: false,
  error: null,
  unreadCount: 0,
  showPriority: true, // Configuration to show/hide priority badges


  fetchTickets: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await UserTicketService.getAllTickets();
      
      const TransformData = response?.data?.map(item => ({
        "ticketId": item.ticketId,
      "subject": item.title,
      "description": item.description,
      "category": item.categoryId?.name,
      "priority": item.priority,
      "status": item.status,
      "createdAt": item.createdAt,
      "updatedAt": item.updatedAt,
      "lastMessage": utils.convertToRelativeTime(item.updatedAt),
      "messages": [],
      }));
     
      set({ tickets: TransformData, isLoading: false });
      
      // if (response && response.data) {
      //   set({ tickets: response.data, isLoading: false });
      // } else {
      //   set({ tickets: [], isLoading: false, error: 'No data received from server' });
      // }
    } catch (error) {
      console.error('Error fetching tickets:', error);
      set({ 
        tickets: [], 
        isLoading: false, 
        error: error.message || 'Failed to fetch tickets' 
      });
    }
  },

  refreshTickets: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await UserTicketService.getAllTickets();
     
      const TransformData = response?.data?.map(item => ({
      "ticketId": item.ticketId,
      "subject": item.title,
      "description": item.description,
      "category": item.categoryId?.name,
      "priority": item.priority,
      "status": item.status,
      "createdAt": item.createdAt,
      "updatedAt": item.updatedAt,
      "lastMessage": utils.convertToRelativeTime(item.updatedAt),
      "messages": [],
      }));
      console.log('TransformData', TransformData);
      set({ tickets: TransformData, isLoading: false });
      
      // if (response && response.data) {
      //   set({ tickets: response.data, isLoading: false });
      // } else {
      //   set({ tickets: [], isLoading: false, error: 'No data received from server' });
      // }
    } catch (error) {
      console.error('Error fetching tickets:', error);
      set({ 
        tickets: [], 
        isLoading: false, 
        error: error.message || 'Failed to fetch tickets' 
      });
    }
  },

  fetchTicketDetails: async (ticketId) => {
    try {
      const response = await UserTicketService.getTicketDetails(ticketId);
  
      
      if (response && response.data) {
        return response.data;
      } else {
        console.error('No ticket details received');
        return null;
      }
    } catch (error) {
      console.error('Error fetching ticket details:', error);
      return null;
    }
  },

  // Actions
  setTickets: (tickets) => set({ tickets }),
  
  setSelectedTicket: (ticket) => set({ selectedTicket: ticket }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),
  
  setUnreadCount: (count) => set({ unreadCount: count }),
  
  setShowPriority: (show) => set({ showPriority: show }),

  // Create new ticket
  createTicket: (ticketData) => {
    const newTicket = {
      ...ticketData,
      ticketId: `TKT${Date.now()}`,
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastMessage: 'Just now',
      messages: [
        {
          id: `msg${Date.now()}`,
          content: ticketData.description,
          sender: 'user',
          timestamp: new Date().toISOString(),
          status: 'sent'
        }
      ]
    };

    set((state) => ({
      tickets: [newTicket, ...state.tickets],
      selectedTicket: newTicket
    }));

    return newTicket;
  },

  // Add message to ticket
  addMessage: (ticketId, message,userId) => {
   
    const newMessage = {
      id: `msg${Date.now()}`,
      content: message,
      sender: userId,
      timestamp: new Date().toISOString(),
      status: 'sent'
    };

    set((state) => ({
      tickets: state.tickets.map(ticket => 
        ticket.ticketId === ticketId 
          ? {
              ...ticket,
              updatedAt: new Date().toISOString(),
              lastMessage: 'Just now',
              messages: [...ticket.messages, newMessage]
            }
          : ticket
      ),
      selectedTicket: state.selectedTicket?.ticketId === ticketId 
        ? {
            ...state.selectedTicket,
            updatedAt: new Date().toISOString(),
            lastMessage: 'Just now',
            messages: [...state.selectedTicket.messages, newMessage]
          }
        : state.selectedTicket
    }));
  },

  // Simulate agent response
  addAgentResponse: (ticketId, response) => {
    const agentMessage = {
      id: `msg${Date.now()}`,
      content: response,
      sender: 'agent',
      timestamp: new Date().toISOString(),
      status: 'read'
    };

    set((state) => ({
      tickets: state.tickets.map(ticket => 
        ticket.ticketId === ticketId 
          ? {
              ...ticket,
              updatedAt: new Date().toISOString(),
              lastMessage: 'Just now',
              messages: [...ticket.messages, agentMessage]
            }
          : ticket
      ),
      selectedTicket: state.selectedTicket?.ticketId === ticketId 
        ? {
            ...state.selectedTicket,
            updatedAt: new Date().toISOString(),
            lastMessage: 'Just now',
            messages: [...state.selectedTicket.messages, agentMessage]
          }
        : state.selectedTicket
    }));
  },

  // Update ticket status
  updateTicketStatus: (ticketId, status) => {
    set((state) => ({
      tickets: state.tickets.map(ticket => 
        ticket.ticketId === ticketId 
          ? { ...ticket, status, updatedAt: new Date().toISOString() }
          : ticket
      ),
      selectedTicket: state.selectedTicket?.ticketId === ticketId 
        ? { ...state.selectedTicket, status, updatedAt: new Date().toISOString() }
        : state.selectedTicket
    }));
  },

  // Get ticket by ID
  getTicketById: (ticketId) => {
    const state = get();
    return state.tickets.find(ticket => ticket.ticketId === ticketId);
  },

  // Get tickets by status
  getTicketsByStatus: (status) => {
    const state = get();
    return state.tickets?.filter(ticket => ticket.status === status);
  },

  // Get tickets by category
  getTicketsByCategory: (category) => {
    const state = get();
    return state.tickets.filter(ticket => ticket.category === category);
  },

  // Search tickets
  searchTickets: (query) => {
    const state = get();
    const lowercaseQuery = query.toLowerCase();
    return state.tickets.filter(ticket => 
      ticket.subject.toLowerCase().includes(lowercaseQuery) ||
      ticket.description.toLowerCase().includes(lowercaseQuery) ||
      ticket.ticketId.toLowerCase().includes(lowercaseQuery)
    );
  },

  // Calculate unread messages
  calculateUnreadCount: () => {
    const state = get();
    const unreadCount = state.tickets.reduce((count, ticket) => {
      const unreadMessages = ticket.messages.filter(msg => 
        msg.sender === 'agent' && msg.status === 'sent'
      ).length;
      return count + unreadMessages;
    }, 0);
    
    set({ unreadCount });
    return unreadCount;
  },

  // Mark messages as read
  markMessagesAsRead: (ticketId) => {
    set((state) => {
      // Check if there are any unread messages to mark as read
      const ticket = state.tickets.find(t => t.ticketId === ticketId);
      const hasUnreadMessages = ticket?.messages.some(msg => 
        msg.sender === 'agent' && msg.status === 'sent'
      );
      
      // If no unread messages, don't update state
      if (!hasUnreadMessages) {
        return state;
      }
      
      return {
        tickets: state.tickets.map(ticket => 
          ticket.ticketId === ticketId 
            ? {
                ...ticket,
                messages: ticket.messages.map(msg => 
                  msg.sender === 'agent' && msg.status === 'sent'
                    ? { ...msg, status: 'read' }
                    : msg
                )
              }
            : ticket
        ),
        selectedTicket: state.selectedTicket?.ticketId === ticketId 
          ? {
              ...state.selectedTicket,
              messages: state.selectedTicket.messages.map(msg => 
                msg.sender === 'agent' && msg.status === 'sent'
                  ? { ...msg, status: 'read' }
                  : msg
              )
            }
          : state.selectedTicket
      };
    });
  },

  // Simulate API call for creating ticket
  createTicketAsync: async (ticketData) => {
    set({ isLoading: true, error: null });
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newTicket = get().createTicket(ticketData);
      set({ isLoading: false });
      
      return newTicket;
    } catch (error) {
      set({ isLoading: false, error: error.message });
      throw error;
    }
  },

  // Simulate API call for adding message
  addMessageAsync: async (ticketId, message,userId) => {
   
    
    try {
     
      get().addMessage(ticketId, message,userId);
      
    } catch (error) {
      set({ isLoading: false, error: error.message });
      throw error;
    }
  },

  // Simulate agent response after delay
  simulateAgentResponse: async (ticketId) => {
    const responses = [
      "Thank you for reaching out. I'm looking into this issue for you.",
      "I understand your concern. Let me investigate this matter.",
      "I apologize for the inconvenience. I'm working on resolving this.",
      "Thank you for providing those details. I can see the issue now.",
      "I've escalated this to our technical team for further investigation.",
      "Your issue has been resolved. Is there anything else I can help you with?"
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    // Simulate agent response after 2-5 seconds
    setTimeout(() => {
      get().addAgentResponse(ticketId, randomResponse);
    }, Math.random() * 3000 + 2000);
  },

  // Reset store
  reset: () => {
    set({
      tickets: supportData.tickets,
      selectedTicket: null,
      isLoading: false,
      error: null,
      unreadCount: 0
    });
  }
}));

export default useSupportStore; 