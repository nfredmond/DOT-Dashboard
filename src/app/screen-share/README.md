# Screen Sharing Feature

This feature allows users to capture screenshots of their screen and analyze them using AI. It's particularly useful for getting help with complex interfaces, troubleshooting issues, or extracting information from visual content.

## How It Works

1. The user captures a screenshot using the browser's screen capture API
2. The screenshot is sent to the server along with a query about what to analyze
3. The server processes the image using OpenAI's GPT-4 Vision model
4. The analysis is returned to the user

## Components

- `ScreenSharePanel.tsx`: The main UI component for capturing and analyzing screenshots
- `screen-share-service.ts`: Service for handling screenshot capture and API communication
- `api/screen-share/route.ts`: API endpoint for processing screenshots with OpenAI

## Requirements

- An OpenAI API key with access to GPT-4 Vision
- Modern browser with screen capture API support (Chrome, Firefox, Edge, Safari)

## Environment Variables

Make sure to set the following environment variable:

```
OPENAI_API_KEY=your_openai_api_key_here
```

## Usage Limits

- Maximum image size: 10MB
- Response tokens: Limited to 1000 tokens

## Privacy Considerations

- Screenshots are processed in memory and not stored permanently
- Data is sent securely to OpenAI for processing
- Users should be cautious about sharing sensitive information in screenshots 