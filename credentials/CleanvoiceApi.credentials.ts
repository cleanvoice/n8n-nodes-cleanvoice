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
	];

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.cleanvoice.ai/v2',
			url: '/configurations',
			method: 'GET',
			headers: {
				'X-API-KEY': '={{$credentials.apiKey}}',
			},
		},
	};
}
