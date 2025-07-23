export const CLEANVOICE_API_BASE = 'https://api.cleanvoice.ai/v2';

export const API_ENDPOINTS = {
	CONFIGURATIONS: '/configurations',
	EDITS: '/edits',
	COMPLETED_TASKS: '/completed_tasks',
} as const;

export const UPLOAD_TYPES = {
	AUDIO: 'single track',
	VIDEO: 'video',
} as const;

export const HTTP_HEADERS = {
	API_KEY: 'X-API-KEY',
	CONTENT_TYPE: 'application/json',
	ACCEPT: 'application/json',
} as const;
