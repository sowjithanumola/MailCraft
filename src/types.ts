export type Tone = 'formal' | 'friendly' | 'professional' | 'casual' | 'urgent';
export type Recipient = 'boss' | 'teacher' | 'client' | 'friend' | 'colleague' | 'general';
export type Length = 'short' | 'medium' | 'long';

export interface EmailRequest {
  purpose: string;
  recipient: Recipient;
  tone: Tone;
  keyPoints: string;
  length: Length;
  language: string;
}

export interface GeneratedEmail {
  id: string;
  subject: string;
  body: string;
  timestamp: number;
  request: EmailRequest;
}
