export interface CleanvoiceCreateEditBody {
	input: {
		files: string[];
		config: Record<string, any>;
		template_id: string;
		upload_type: string;
	};
}

export interface CleanvoiceTask {
	id: string;
	created_at: string;
	status: string;
	results: {
		video: boolean;
		filename: string;
		statistics: {
			BREATH: number;
		};
		download_url: string;
		summarization: any[];
		transcription: any[];
		social_content: any[];
		waveform_result: any[];
		merged_audio_url: any[];
		timestamps_markers_urls: {
			markers_reaper: string;
			timeline_reaper: string;
			markers_audacity: string;
			markers_audition: string;
			timeline_audacity: string;
			timeline_audition: string;
		};
	};
	length_audio: number;
}

export interface CleanvoiceApiResponse {
	tasks: CleanvoiceTask[];
}

export interface CleanvoiceConfiguration {
	id: string;
	name: string;
	upload_type: string;
}
