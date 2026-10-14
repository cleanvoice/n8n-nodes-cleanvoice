import type { ICredentialDataDecryptedObject } from 'n8n-workflow';

const DEFAULT_API_BASE_URL = 'https://api.cleanvoice.ai/v2';

// Credentials created before the baseUrl field existed resolve to the default.
export function getApiBaseUrl(credentials: ICredentialDataDecryptedObject): string {
	const baseUrl = (credentials.baseUrl as string | undefined)?.trim() || DEFAULT_API_BASE_URL;
	return baseUrl.replace(/\/+$/, '');
}
