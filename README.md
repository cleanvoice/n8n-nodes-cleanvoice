# n8n-nodes-cleanvoice

This is an n8n community node. It lets you use [Cleanvoice AI](https://cleanvoice.ai) in your n8n workflows.

Cleanvoice AI is an advanced audio and video processing service that removes filler words, mouth sounds, background noise, and other unwanted audio artifacts from recordings using artificial intelligence. It helps content creators, podcasters, and video producers automatically clean their audio to create more professional-sounding content.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation)  
[Operations](#operations)  
[Credentials](#credentials)  
[Compatibility](#compatibility)  
[Usage](#usage)  
[Resources](#resources)  

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

1. Go to **Settings** > **Community Nodes**
2. Select **Install**
3. Enter `n8n-nodes-cleanvoice`
4. Agree to the risks of using community nodes (if prompted)
5. Select **Install**

After installation restart n8n to register the new nodes.

## Operations

This package contains two nodes:

### Cleanvoice AI Node
- **Create Edit**: Submit audio or video files for AI processing to remove filler words, mouth sounds, and background noise

### Cleanvoice AI Trigger Node  
- **Watch Completions**: Monitors for completed edit tasks and triggers when processing is finished

## Credentials

To use these nodes, you need a Cleanvoice AI account and API key.

### Prerequisites
1. Sign up for a [Cleanvoice AI account](https://cleanvoice.ai)
2. Generate an API key from your Cleanvoice dashboard

### Setting up credentials in n8n
1. Go to **Credentials** in your n8n instance
2. Click **+ Create New**
3. Search for "Cleanvoice AI API" and select it
4. Enter your API key from Cleanvoice
5. Click **Save**

The credential includes a built-in test to verify your API key is working correctly.

## Compatibility

- Minimum n8n version: 1.0.0
- Tested with n8n versions: 1.0.0+
- Node API version: 1

## Usage

### Basic Audio Processing Workflow

1. **Add the Cleanvoice AI node** to your workflow
2. **Configure the node**:
   - Select your Cleanvoice AI credentials
   - Set Resource to "Edit"
   - Set Operation to "Create"
   - Enter the file URL of your audio/video file
   - Choose upload type (Audio or Video)
   - Select a processing template

3. **File URL**: Can be any publicly accessible URL or use n8n's file handling capabilities
4. **Templates**: The node dynamically loads available processing templates from your Cleanvoice account based on upload type

### Example: Process Podcast Episode

```json
{
  "nodes": [
    {
      "name": "Manual Trigger",
      "type": "n8n-nodes-base.manualTrigger"
    },
    {
      "name": "Cleanvoice AI",
      "type": "cleanvoice",
      "parameters": {
        "resource": "edit",
        "operation": "create",
        "fileUrl": "https://example.com/podcast-episode.mp3",
        "uploadType": "single track",
        "template": "your-template-id"
      },
      "credentials": {
        "cleanvoiceApi": "your-cleanvoice-credentials"
      }
    }
  ]
}
```

### Using the Trigger Node

The Cleanvoice AI Trigger node monitors for completed processing tasks and fires when new tasks are detected:

1. **Add the trigger node** to start a new workflow
2. **Configure monitoring**:
   - Select your credentials
   - Choose upload type to monitor
   - Select template to filter completions
3. **Important Behavior**: The trigger only fires for tasks that are completed **after** the trigger workflow is activated. It establishes a baseline on the first run and will not trigger for tasks that were already completed before activation.
4. **Deduplication**: The trigger maintains a list of already-processed task IDs to prevent duplicate triggers
5. **Time Window**: Only monitors tasks from the last 7 days to keep the processed task list manageable
6. **Workflow continues** with the processed file data when new completions are detected

**Note**: When you first activate a trigger workflow, it will scan existing completed tasks to establish a baseline but will not trigger on them. Only newly completed tasks after activation will trigger the workflow.

### Processing Different File Types

**Audio Files** (upload type: "Audio"):
- MP3, WAV, M4A, FLAC
- Podcasts, interviews, voice recordings
- Background music removal, filler word detection

**Video Files** (upload type: "Video"):  
- MP4, MOV, AVI
- Video podcasts, tutorials, presentations
- Audio track cleaning while preserving video

### Output Data

The node returns comprehensive information about the processing task:
- Task ID and status
- Download URLs for processed files
- Processing statistics (e.g., filler words removed)
- Timeline markers for various audio editing software
- Transcription and summarization data (if enabled)

### Error Handling

The node includes proper error handling:
- API authentication errors
- Invalid file URLs
- Processing failures
- Rate limiting

Enable "Continue on Fail" to handle errors gracefully in production workflows.

## Resources

* [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
* [Cleanvoice AI API Documentation](https://api.cleanvoice.ai/docs)
* [Cleanvoice AI Website](https://cleanvoice.ai)
* [Cleanvoice AI Support](mailto:support@cleanvoice.ai)

## License

[MIT](LICENSE.md)
