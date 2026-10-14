import type { ICredentialType, INodeProperties, ICredentialTestRequest } from 'n8n-workflow';

export class CleanvoiceApi implements ICredentialType {
	name = 'cleanvoiceApi';
	displayName = 'Cleanvoice AI API';
	documentationUrl = 'https://api.cleanvoice.ai/docs';
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			required: true,
			default: '',
			description: 'The API key for your Cleanvoice AI account',
		},
		{
			displayName: 'API Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://api.cleanvoice.ai/v2',
			description:
				'Cleanvoice API base URL. Keep the default for production; override only for a test or staging environment.',
		},
	];

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl}}',
			url: '/configurations',
			method: 'GET',
			headers: {
				'X-API-KEY': '={{$credentials.apiKey}}',
			},
		},
	};
}
