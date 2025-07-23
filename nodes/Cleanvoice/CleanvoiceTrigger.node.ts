import type {
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
	IPollFunctions,
	ILoadOptionsFunctions,
	IHttpRequestMethods,
} from 'n8n-workflow';

import { NodeConnectionType } from 'n8n-workflow';

export class CleanvoiceTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Cleanvoice AI Trigger',
		name: 'cleanvoiceTrigger',
		icon: 'file:cleanvoice.svg',
		group: ['trigger'],
		version: 1,
		subtitle: 'Watch for completed edits',
		description: 'Triggers when a Cleanvoice AI edit is completed',
		defaults: {
			name: 'Cleanvoice AI Trigger',
		},
		inputs: [],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: 'cleanvoiceApi',
				required: true,
			},
		],
		polling: true,
		properties: [
			{
				displayName: 'Upload Type',
				name: 'uploadType',
				type: 'options',
				required: true,
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
				description: 'Type of content to watch for completions',
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

	async poll(this: IPollFunctions): Promise<INodeExecutionData[][]> {
		const pollData = this.getWorkflowStaticData('node');
		const template = this.getNodeParameter('template') as string;
		const credentials = await this.getCredentials('cleanvoiceApi');

		const options = {
			method: 'GET' as IHttpRequestMethods,
			uri: `https://api.cleanvoice.ai/v2/completed_tasks/${template}`,
			headers: {
				'X-API-KEY': credentials.apiKey,
			},
			qs: {
				limit: 10,
			},
			json: true,
		};

		const response = await this.helpers.request(options);

		// Handle response structure
		let tasks: any[] = [];
		if (response && response.tasks && Array.isArray(response.tasks)) {
			tasks = response.tasks;
		}

		// If no tasks, return empty
		if (tasks.length === 0) {
			return [[]];
		}

		// Filter valid tasks with dates
		const validTasks = tasks.filter((task: any) => {
			return task && task.created_at && typeof task.created_at === 'string';
		});

		if (validTasks.length === 0) {
			return [[]];
		}

		// Sort by created_at descending (newest first)
		const sortedTasks = validTasks.sort((a: any, b: any) => {
			return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
		});

		if (!pollData.lastTimeChecked) {
			// First run - set timestamp and return latest task
			pollData.lastTimeChecked = new Date().toISOString();
			return [this.helpers.returnJsonArray([sortedTasks[0]])];
		} else {
			// Subsequent runs - check for new tasks
			const lastTimeChecked = new Date(pollData.lastTimeChecked as string);
			const newTasks = sortedTasks.filter((task: any) => {
				const taskDate = new Date(task.created_at);
				return taskDate > lastTimeChecked;
			});

			if (newTasks.length > 0) {
				pollData.lastTimeChecked = new Date().toISOString();
				return [this.helpers.returnJsonArray(newTasks)];
			}
		}

		return [[]];
	}
}
