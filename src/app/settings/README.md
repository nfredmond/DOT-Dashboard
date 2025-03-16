# Settings

The settings section provides users with comprehensive control over their experience with the Planning Manager application. This directory contains several configuration pages for different aspects of the application.

## Settings Pages

### Model Settings

Located at `/settings/models`, this page allows users to manage AI models used throughout the application:

- **Model Selection**: Choose from standard models (Claude, GPT, etc.) or custom models
- **Custom Model Management**: Add, edit, and remove custom models with specific capabilities
- **Capability Configuration**: Select models with specific capabilities (thinking, vision, research, code)

The model selection system automatically chooses the most appropriate model based on your current task requirements, but you can override these selections with your preferences.

### Voice Settings

Located at `/settings/voice`, this page offers configuration for the voice interaction system:

- **Text-to-Speech (TTS)**: Configure voice model, voice type, and speech rate
- **Speech-to-Text (STT)**: Configure transcription models and options
- **Voice Behavior**: Toggle automatic transcription, automatic responses, and special commands

The voice integration system allows for natural interaction with the application through voice commands and responses, making it accessible and efficient to use in various contexts.

### Theme Settings

Located at `/settings/theme`, this page lets users customize the application's appearance:

- **Color Theme**: Choose between light, dark, or system-based themes
- **UI Density**: Select compact, comfortable, or spacious layouts
- **Typography**: Adjust font size and family for better readability

## Technical Details

### Model Selection System

The model selection system uses a context-based architecture to provide optimal AI capabilities:

1. **Model Types and Capabilities**: Defined in `@/lib/models/model-types.ts`
2. **Model Service**: Core logic in `@/lib/models/model-service.ts`
3. **React Context**: Provider and hooks in `@/lib/models/model-context.tsx`
4. **UI Components**: `ModelSelector.tsx` and `ModelBadge.tsx` for user interaction

This architecture allows for automatic model selection based on task requirements while maintaining user override options.

### Voice Integration

The voice system provides a seamless interface for audio interaction:

1. **Voice Service**: Core audio functionality in `@/lib/voice-service.ts`
2. **Voice Agent**: Command processing in `@/lib/voice-agent-service.ts`
3. **API Routes**: Processing endpoints in `@/app/api/voice/*`
4. **UI Components**: Speech recording and playback components in `@/components/voice-*`

Voice commands are processed through a pipeline that includes transcription, intent detection, and response generation, using the selected AI models for each step.

## Integration Points

The settings configured in this section affect various components throughout the application:

- **Project Dashboard**: Uses model selection for analysis and planning
- **Voice Assistant**: Available on all pages for quick commands and queries
- **Document Generation**: Uses selected models for different document types
- **Analytics**: Uses thinking-capable models for data interpretation

## Development Guidelines

When extending the settings functionality:

1. Update the appropriate context provider when adding new settings
2. Maintain backward compatibility with existing configurations
3. Add proper documentation for new settings options
4. Implement sensible defaults for all settings
5. Ensure settings are saved to user preferences 