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
		usableAsTool: true,
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
		const isManualMode = this.getMode() === 'manual';
		const pollData = this.getWorkflowStaticData('global');
		const template = this.getNodeParameter('template') as string;
		const credentials = await this.getCredentials('cleanvoiceApi');

		const processedKey = `cleanvoice_processed_${template}`;
		const baselineKey = `cleanvoice_baseline_${template}`;

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

		let tasks: any[] = [];
		if (response && response.tasks && Array.isArray(response.tasks)) {
			tasks = response.tasks;
		} else if (response && Array.isArray(response)) {
			tasks = response;
		}

		if (tasks.length === 0) {
			return [[]];
		}

		const validTasks = tasks.filter((task: any) => {
			return task && task.id && task.created_at && typeof task.created_at === 'string';
		});

		if (validTasks.length === 0) {
			return [[]];
		}

		const sortedTasks = validTasks.sort((a: any, b: any) => {
			return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
		});

		// In manual/test mode, return the most recent task without touching persisted state.
		// This prevents test runs from marking tasks as processed and blocking production triggers.
		if (isManualMode) {
			return [this.helpers.returnJsonArray([sortedTasks[0]])];
		}

		if (!pollData[processedKey] || !pollData[baselineKey]) {
			pollData[processedKey] = [];
			pollData[baselineKey] = sortedTasks[0].created_at;

			const allCurrentTaskIds = sortedTasks.map((task: any) => task.id);
			pollData[processedKey] = allCurrentTaskIds;

			return [[]];
		}

		const baselineTimestamp = new Date(pollData[baselineKey] as string);

		const cutoffTimestamp = new Date(baselineTimestamp.getTime() - (7 * 24 * 60 * 60 * 1000));

		const recentTasks = sortedTasks.filter((task: any) => {
			const taskDate = new Date(task.created_at);
			return taskDate >= cutoffTimestamp;
		});

		const processedIds = new Set(pollData[processedKey] as string[]);

		const newTasks = recentTasks.filter((task: any) => !processedIds.has(task.id));

		if (newTasks.length === 0) {
			return [[]];
		}

		newTasks.forEach((task: any) => {
			processedIds.add(task.id);
		});

		const processedIdsArray = Array.from(processedIds);
		if (processedIdsArray.length > 200) {
			pollData[processedKey] = processedIdsArray.slice(-200);
		} else {
			pollData[processedKey] = processedIdsArray;
		}

		return [this.helpers.returnJsonArray(newTasks)];
	}
}
