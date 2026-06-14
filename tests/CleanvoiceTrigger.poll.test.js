const test = require('node:test');
const assert = require('node:assert/strict');

const { CleanvoiceTrigger } = require('../dist/nodes/Cleanvoice/CleanvoiceTrigger.node.js');

const template = 'template-1';
const processedKey = `cleanvoice_processed_${template}`;
const baselineKey = `cleanvoice_baseline_${template}`;

function task(id, createdAt) {
	return {
		id,
		created_at: createdAt,
		status: 'done',
	};
}

function createPollContext({
	mode = 'trigger',
	activationMode = 'activate',
	staticData = {},
	tasks = [],
} = {}) {
	return {
		getMode: () => mode,
		getActivationMode: () => activationMode,
		getWorkflowStaticData: () => staticData,
		getNodeParameter: (name) => {
			assert.equal(name, 'template');
			return template;
		},
		getCredentials: async (name) => {
			assert.equal(name, 'cleanvoiceApi');
			return { apiKey: 'test-key' };
		},
		helpers: {
			request: async (options) => {
				assert.equal(options.uri, `https://api.cleanvoice.ai/v2/completed_tasks/${template}`);
				return { tasks };
			},
			returnJsonArray: (items) => items.map((json) => ({ json })),
		},
	};
}

async function poll(context) {
	return new CleanvoiceTrigger().poll.call(context);
}

test('manual activation returns a sample task without marking it processed', async () => {
	const staticData = {};
	const tasks = [
		task('newest', '2026-06-14T16:00:00.000Z'),
		task('older', '2026-06-14T15:00:00.000Z'),
	];

	const result = await poll(
		createPollContext({
			mode: 'trigger',
			activationMode: 'manual',
			staticData,
			tasks,
		}),
	);

	assert.deepEqual(result, [[{ json: tasks[0] }]]);
	assert.deepEqual(staticData, {});
});

test('production activation baselines existing tasks without emitting them', async () => {
	const staticData = {};
	const tasks = [
		task('newest', '2026-06-14T16:00:00.000Z'),
		task('older', '2026-06-14T15:00:00.000Z'),
	];

	const result = await poll(createPollContext({ staticData, tasks }));

	assert.deepEqual(result, [[]]);
	assert.deepEqual(staticData[processedKey], ['newest', 'older']);
	assert.equal(staticData[baselineKey], tasks[0].created_at);
});

test('production activation emits only unprocessed completed tasks once', async () => {
	const staticData = {
		[processedKey]: ['older'],
		[baselineKey]: '2026-06-14T15:00:00.000Z',
	};
	const tasks = [
		task('newest', '2026-06-14T16:00:00.000Z'),
		task('older', '2026-06-14T15:00:00.000Z'),
	];

	const firstResult = await poll(createPollContext({ staticData, tasks }));
	const secondResult = await poll(createPollContext({ staticData, tasks }));

	assert.deepEqual(firstResult, [[{ json: tasks[0] }]]);
	assert.deepEqual(secondResult, [[]]);
	assert.deepEqual(staticData[processedKey], ['older', 'newest']);
});
