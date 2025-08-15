# Enhanced Streaming Implementation

This project now includes enhanced real-time streaming capabilities similar to we0, providing immediate feedback during AI interactions while maintaining the existing UI/UX.

## Features

- **Real-time Streaming**: See AI responses as they're generated, character by character
- **Switchable Streams**: Support for multiple response segments with automatic continuation
- **Enhanced UI**: Streaming cursor animation and visual feedback
- **Backward Compatibility**: Existing chat functionality remains unchanged
- **Model Selection**: Support for different AI models with streaming

## Components

### 1. SwitchableStream (`src/lib/internal/switchable-stream.ts`)
A custom TransformStream implementation that allows switching between different stream sources, enabling continuous AI responses.

### 2. Enhanced Streaming Response (`src/lib/internal/stream-response.ts`)
Utility for creating streaming responses with automatic message continuation and error handling.

### 3. Enhanced Chat Component (`src/components/enhanced-chat.tsx`)
A new chat component that implements real-time streaming while maintaining the existing design.

### 4. Enhanced API Route (`src/app/api/chat/enhanced/route.ts`)
New API endpoint that provides enhanced streaming capabilities.

## Usage

### Basic Enhanced Chat

```tsx
import { EnhancedChat } from "@/components/enhanced-chat";

<EnhancedChat
  appId="your-app-id"
  initialMessages={messages}
  running={false}
  selectedModel="gemini-2.5-pro"
/>
```

### Existing Chat with Enhanced Option

```tsx
import { Chat } from "@/components/chat";

<Chat
  appId="your-app-id"
  initialMessages={messages}
  running={false}
  selectedModel="gemini-2.5-pro"
  useEnhancedStreaming={true} // Enable enhanced streaming
/>
```

### Demo Page

Visit `/enhanced-demo` to see the enhanced streaming in action.

## API Endpoints

### Enhanced Chat API
- **POST** `/api/chat/enhanced`
- **Headers**: `Adorable-App-Id`, `x-selected-model` (optional)
- **Body**: `{ messages: UIMessage[], model?: string }`

### Existing Chat API
- **POST** `/api/chat`
- **Headers**: `Adorable-App-Id`, `x-selected-model` (optional)
- **Body**: `{ messages: UIMessage[] }`

## Streaming Features

### 1. Real-time Text Generation
- See AI responses as they're typed
- Smooth character-by-character display
- Animated cursor during streaming

### 2. Automatic Continuation
- AI can continue responses across multiple segments
- Maximum of 3 response segments per conversation
- Seamless user experience

### 3. Error Handling
- Graceful error recovery
- User-friendly error messages
- Automatic stream cleanup

### 4. Model Support
- Gemini 2.5 Pro (default)
- GPT models (OpenAI)
- Claude models (Anthropic)
- ChatAnywhere compatibility

## CSS Classes

### Streaming Animation
```css
.streaming-content {
  position: relative;
}

.streaming-content::after {
  content: '';
  display: inline-block;
  width: 2px;
  height: 1em;
  background-color: currentColor;
  margin-left: 2px;
  animation: blink 1s infinite;
}

.streaming-cursor {
  display: inline-block;
  width: 2px;
  height: 1.2em;
  background-color: #3b82f6;
  margin-left: 2px;
  animation: pulse 1.5s ease-in-out infinite;
}
```

## Configuration

### Environment Variables
- `MAX_OUTPUT_TOKENS`: Maximum tokens per response (default: 20000)
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string

### Model Configuration
Models are configured in `src/mastra/agents/builder.ts` and can be extended to support additional providers.

## Performance Considerations

- **Streaming Overhead**: Minimal impact on response time
- **Memory Usage**: Efficient stream handling with automatic cleanup
- **Network**: Uses Server-Sent Events (SSE) for optimal streaming
- **Caching**: Redis-based stream state management

## Troubleshooting

### Common Issues

1. **Stream Not Starting**
   - Check if the app ID is valid
   - Verify Redis connection
   - Ensure the AI model is accessible

2. **Streaming Stops Prematurely**
   - Check token limits
   - Verify model availability
   - Check network connectivity

3. **UI Not Updating**
   - Ensure React state is properly managed
   - Check for JavaScript errors
   - Verify component re-rendering

### Debug Mode

Enable debug logging by setting:
```bash
DEBUG=streaming:*
```

## Future Enhancements

- [ ] Image streaming support
- [ ] Tool call streaming
- [ ] Multi-modal streaming
- [ ] Stream analytics
- [ ] Custom streaming protocols

## Contributing

When adding new streaming features:

1. Maintain backward compatibility
2. Follow the existing code patterns
3. Add proper error handling
4. Include TypeScript types
5. Update this documentation

## License

This enhanced streaming implementation follows the same license as the main project.