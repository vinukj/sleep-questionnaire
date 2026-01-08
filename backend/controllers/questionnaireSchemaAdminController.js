import pool from '../config/db.js';

// Upsert questionnaire schema (admin-only)
// Body: { name?: string = 'STJohnQuestionnaire', schema: array|string }
export const upsertQuestionnaireSchema = async (req, res) => {
	try {
		const name = (req.body?.name || 'STJohnQuestionnaire').trim();
		let schema = req.body?.schema;

		if (!schema) {
			return res.status(400).json({ error: 'Missing schema in request body' });
		}

		// Allow schema to be sent as stringified JSON
		if (typeof schema === 'string') {
			try {
				schema = JSON.parse(schema);
			} catch (e) {
				return res.status(400).json({ error: 'Invalid schema JSON string' });
			}
		}

		// Minimal validation: expect an array of pages with questions
		if (!Array.isArray(schema)) {
			return res.status(400).json({ error: 'Schema must be an array of pages' });
		}

		const isValid = schema.every(page =>
			page && typeof page === 'object' &&
			typeof page.page !== 'undefined' &&
			Array.isArray(page.questions)
		);

		if (!isValid) {
			return res.status(400).json({ error: 'Schema pages must include a page number and questions[]' });
		}

		const query = `
			INSERT INTO questionnaire_schemas (name, schema)
			VALUES ($1, $2)
			ON CONFLICT (name)
			DO UPDATE SET schema = EXCLUDED.schema, updated_at = CURRENT_TIMESTAMP
			RETURNING id;
		`;

		const result = await pool.query(query, [name, JSON.stringify(schema)]);
		return res.status(200).json({
			message: 'Questionnaire schema saved',
			id: result.rows[0]?.id,
			name
		});
	} catch (error) {
		console.error('Error upserting questionnaire schema:', error);
		return res.status(500).json({ error: 'Internal server error' });
	}
};
