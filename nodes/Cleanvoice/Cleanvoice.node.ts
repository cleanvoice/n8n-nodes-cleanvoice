import type {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
	IHttpRequestMethods,
} from 'n8n-workflow';

import { NodeConnectionType } from 'n8n-workflow';

export class Cleanvoice implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Cleanvoice AI',
		name: 'cleanvoice',
		icon: 'file:cleanvoice.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Cleanvoice AI for audio and video processing',
		defaults: {
			name: 'Cleanvoice AI',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		usableAsTool: true,
		credentials: [
			{
				name: 'cleanvoiceApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Edit',
						value: 'edit',
					},
				],
				default: 'edit',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['edit'],
					},
				},
				options: [
					{
						name: 'Create',
						value: 'create',
						action: 'Create an edit',
						description: 'Create a new edit task',
					},
				],
				default: 'create',
			},
			// Create Edit Fields
			{
				displayName: 'File URL',
				name: 'fileUrl',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['edit'],
						operation: ['create'],
					},
				},
				default: '',
				description: 'URL of the file to process',
			},
			{
				displayName: 'Upload Type',
				name: 'uploadType',
				type: 'options',
				required: true,
				displayOptions: {
					show: {
						resource: ['edit'],
						operation: ['create'],
					},
				},
				options: [
					{
						name: 'Audio',
						value: 'single track',
					},
					{
						name: 'Video',
						value: 'video',
					},
				],
				default: 'single track',
				description: 'Type of content to upload',
			},
			{
				displayName: 'Template Name or ID',
				name: 'template',
				type: 'options',
				required: true,
				typeOptions: {
					loadOptionsMethod: 'getTemplates',
					loadOptionsDependsOn: ['uploadType'],
				},
				displayOptions: {
					show: {
						resource: ['edit'],
						operation: ['create'],
					},
				},
				default: '',
				description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
			},
		],
	};

	methods = {
		loadOptions: {
			async getTemplates(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const uploadType = this.getCurrentNodeParameter('uploadType') as string;
				const credentials = await this.getCredentials('cleanvoiceApi');

				const options = {
					method: 'GET' as IHttpRequestMethods,
					uri: 'https://api.cleanvoice.ai/v2/configurations',
					headers: {
						'X-API-KEY': credentials.apiKey,
					},
					json: true,
				};

				const response = await this.helpers.request(options);

				if (!response.configurations) {
					return [];
				}

				const filteredConfigurations = response.configurations.filter(
					(config: any) => config.upload_type === uploadType,
				);

				return filteredConfigurations.map((config: any) => ({
					name: config.name,
					value: config.id,
				}));
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const resource = this.getNodeParameter('resource', 0);
		const operation = this.getNodeParameter('operation', 0);

		let responseData;
		const returnData: INodeExecutionData[] = [];

		const credentials = await this.getCredentials('cleanvoiceApi');

		for (let i = 0; i < items.length; i++) {
			try {
				if (resource === 'edit' && operation === 'create') {
					// Create Edit
					const fileUrl = this.getNodeParameter('fileUrl', i) as string;
					const uploadType = this.getNodeParameter('uploadType', i) as string;
					const template = this.getNodeParameter('template', i) as string;

					const body = {
						input: {
							files: [fileUrl],
							config: {},
							template_id: template,
							upload_type: uploadType,
						},
					};

					const options = {
						method: 'POST' as IHttpRequestMethods,
						uri: 'https://api.cleanvoice.ai/v2/edits',
						headers: {
							'X-API-KEY': credentials.apiKey,
							'Content-Type': 'application/json',
							'Accept': 'application/json',
						},
						qs: {
							limit: 5,
						},
						body,
						json: true,
					};

					responseData = await this.helpers.request(options);
				}

				const executionData = this.helpers.constructExecutionMetaData(
					this.helpers.returnJsonArray(responseData),
					{ itemData: { item: i } },
				);

				returnData.push(...executionData);
			} catch (error) {
				if (this.continueOnFail()) {
					const executionErrorData = this.helpers.constructExecutionMetaData(
						this.helpers.returnJsonArray({ error: error.message }),
						{ itemData: { item: i } },
					);
					returnData.push(...executionErrorData);
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
