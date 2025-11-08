import { Message } from './types';

// Simple test to verify the Message type
const testMessage: Message = {
  id: '1',
  role: 'user',
  content: 'Hello, Hinata!',
  timestamp: new Date()
};

console.log('Message type test passed:', testMessage);