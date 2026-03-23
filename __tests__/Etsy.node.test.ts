import { Etsy } from '../nodes/Etsy/Etsy.node';

describe('Etsy Node Description', () => {
	const node = new Etsy();
	const { description } = node;

	it('should have correct basic metadata', () => {
		expect(description.displayName).toBe('Etsy');
		expect(description.name).toBe('etsy');
		expect(description.version).toBe(1);
		expect(description.icon).toBe('file:etsy.svg');
		expect(description.usableAsTool).toBe(true);
	});

	it('should require etsyApi credentials', () => {
		expect(description.credentials).toEqual([
			{ name: 'etsyApi', required: true },
		]);
	});

	it('should have all four resources', () => {
		const resourceProp = description.properties.find(
			(p) => p.name === 'resource' && !('displayOptions' in p),
		);
		expect(resourceProp).toBeDefined();
		expect(resourceProp!.type).toBe('options');

		const options = (resourceProp as { options: Array<{ value: string }> }).options;
		const values = options.map((o) => o.value);
		expect(values).toContain('shop');
		expect(values).toContain('listing');
		expect(values).toContain('listingImage');
		expect(values).toContain('receipt');
		expect(values).toContain('review');
		expect(values).toContain('shippingProfile');
		expect(values).toContain('shopSection');
		expect(values).toContain('taxonomy');
		expect(values).toHaveLength(8);
	});

	describe('Shop operations', () => {
		it('should have getMyShop and get operations', () => {
			const opProp = description.properties.find(
				(p) =>
					p.name === 'operation' &&
					p.displayOptions?.show?.resource?.includes('shop'),
			);
			expect(opProp).toBeDefined();

			const options = (opProp as { options: Array<{ value: string }> }).options;
			const values = options.map((o) => o.value);
			expect(values).toContain('getMyShop');
			expect(values).toContain('get');
		});
	});

	describe('Listing operations', () => {
		it('should have all five operations', () => {
			const opProp = description.properties.find(
				(p) =>
					p.name === 'operation' &&
					p.displayOptions?.show?.resource?.includes('listing'),
			);
			expect(opProp).toBeDefined();

			const options = (opProp as { options: Array<{ value: string }> }).options;
			const values = options.map((o) => o.value);
			expect(values).toContain('createDraft');
			expect(values).toContain('delete');
			expect(values).toContain('get');
			expect(values).toContain('getAllActive');
			expect(values).toContain('update');
		});

		it('should require shopId for getAllActive and createDraft', () => {
			const shopIdProp = description.properties.find(
				(p) =>
					p.name === 'shopId' &&
					p.displayOptions?.show?.resource?.includes('listing') &&
					p.displayOptions?.show?.operation?.includes('getAllActive'),
			);
			expect(shopIdProp).toBeDefined();
			expect(shopIdProp!.required).toBe(true);
		});

		it('should require listingId for get, update, and delete', () => {
			const listingIdProp = description.properties.find(
				(p) =>
					p.name === 'listingId' &&
					p.displayOptions?.show?.resource?.includes('listing'),
			);
			expect(listingIdProp).toBeDefined();
			expect(listingIdProp!.required).toBe(true);

			const ops = listingIdProp!.displayOptions!.show!.operation as string[];
			expect(ops).toContain('get');
			expect(ops).toContain('update');
			expect(ops).toContain('delete');
		});

		it('should have all required fields for createDraft', () => {
			const createFields = description.properties.filter(
				(p) =>
					p.displayOptions?.show?.resource?.includes('listing') &&
					p.displayOptions?.show?.operation?.includes('createDraft') &&
					p.required === true,
			);
			const names = createFields.map((f) => f.name);
			expect(names).toContain('title');
			expect(names).toContain('description');
			expect(names).toContain('price');
			expect(names).toContain('quantity');
			expect(names).toContain('whoMade');
			expect(names).toContain('whenMade');
			expect(names).toContain('taxonomyId');
		});

		it('should have update fields collection with correct options', () => {
			const updateFields = description.properties.find(
				(p) =>
					p.name === 'updateFields' &&
					p.displayOptions?.show?.resource?.includes('listing'),
			);
			expect(updateFields).toBeDefined();
			expect(updateFields!.type).toBe('collection');

			const options = (updateFields as { options: Array<{ name: string }> }).options;
			const names = options.map((o) => o.name);
			expect(names).toContain('title');
			expect(names).toContain('description');
			expect(names).toContain('price');
			expect(names).toContain('quantity');
			expect(names).toContain('state');
		});
	});

	describe('Receipt operations', () => {
		it('should have get, getAll, and update operations', () => {
			const opProp = description.properties.find(
				(p) =>
					p.name === 'operation' &&
					p.displayOptions?.show?.resource?.includes('receipt'),
			);
			expect(opProp).toBeDefined();

			const options = (opProp as { options: Array<{ value: string }> }).options;
			const values = options.map((o) => o.value);
			expect(values).toContain('get');
			expect(values).toContain('getAll');
			expect(values).toContain('update');
		});

		it('should have was_paid and was_shipped filters for getAll', () => {
			const filters = description.properties.find(
				(p) =>
					p.name === 'filters' &&
					p.displayOptions?.show?.resource?.includes('receipt'),
			);
			expect(filters).toBeDefined();

			const options = (filters as { options: Array<{ name: string }> }).options;
			const names = options.map((o) => o.name);
			expect(names).toContain('was_paid');
			expect(names).toContain('was_shipped');
		});
	});

	describe('Review operations', () => {
		it('should have getAll operation', () => {
			const opProp = description.properties.find(
				(p) =>
					p.name === 'operation' &&
					p.displayOptions?.show?.resource?.includes('review'),
			);
			expect(opProp).toBeDefined();

			const options = (opProp as { options: Array<{ value: string }> }).options;
			const values = options.map((o) => o.value);
			expect(values).toContain('getAll');
			expect(values).toHaveLength(1);
		});
	});
});
