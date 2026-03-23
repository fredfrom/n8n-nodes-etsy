import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestOptions,
	INodeExecutionData,
} from 'n8n-workflow';
import { Etsy } from '../nodes/Etsy/Etsy.node';

const mockCredentials = {
	clientId: 'test-client-id',
	clientSecret: 'test-client-secret',
	accessToken: 'test-access-token',
	refreshToken: 'test-refresh-token',
};

function createMockExecuteFunctions(
	params: Record<string, unknown>,
	httpResponses: Array<IDataObject | Error>,
): IExecuteFunctions {
	let httpCallIndex = 0;

	const mockHttpRequest = jest.fn().mockImplementation(async () => {
		const response = httpResponses[httpCallIndex++];
		if (response instanceof Error) {
			throw response;
		}
		return response;
	});

	const context = {
		getInputData: () => [{ json: {} }],
		getCredentials: jest.fn().mockResolvedValue(mockCredentials),
		getNodeParameter: jest.fn().mockImplementation((name: string) => {
			if (!(name in params)) {
				throw new Error(`Unexpected parameter: ${name}`);
			}
			return params[name];
		}),
		getNode: jest.fn().mockReturnValue({ name: 'Etsy', type: 'n8n-nodes-etsy.etsy' }),
		continueOnFail: jest.fn().mockReturnValue(false),
		helpers: {
			httpRequest: mockHttpRequest,
			constructExecutionMetaData: jest
				.fn()
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				.mockImplementation((items: INodeExecutionData[], _meta: unknown) => items),
			returnJsonArray: jest.fn().mockImplementation((data: IDataObject) => [{ json: data }]),
		},
	} as unknown as IExecuteFunctions;

	return context;
}

function getHttpRequestArgs(
	context: IExecuteFunctions,
	callIndex = 0,
): IHttpRequestOptions {
	return (context.helpers.httpRequest as jest.Mock).mock.calls[callIndex][0];
}

describe('Etsy Node Execute', () => {
	const node = new Etsy();

	describe('Shop resource', () => {
		it('should call GET /application/users/me/shops for getMyShop', async () => {
			const mockResponse = { shop_id: 123, shop_name: 'TestShop' };
			const context = createMockExecuteFunctions(
				{ resource: 'shop', operation: 'getMyShop' },
				[mockResponse],
			);

			await node.execute.call(context);

			const args = getHttpRequestArgs(context);
			expect(args.method).toBe('GET');
			expect(args.url).toContain('/application/users/me/shops');
			expect(args.headers!['x-api-key']).toBe('test-client-id:test-client-secret');
			expect(args.headers!['Authorization']).toBe('Bearer test-access-token');
		});

		it('should call GET /application/shops/{shopId} for get', async () => {
			const mockResponse = { shop_id: 456, shop_name: 'OtherShop' };
			const context = createMockExecuteFunctions(
				{ resource: 'shop', operation: 'get', shopId: 456 },
				[mockResponse],
			);

			await node.execute.call(context);

			const args = getHttpRequestArgs(context);
			expect(args.method).toBe('GET');
			expect(args.url).toContain('/application/shops/456');
		});
	});

	describe('Listing resource', () => {
		it('should call GET active listings with pagination params', async () => {
			const mockResponse = { count: 1, results: [{ listing_id: 1 }] };
			const context = createMockExecuteFunctions(
				{
					resource: 'listing',
					operation: 'getAllActive',
					shopId: 123,
					limit: 25,
					offset: 10,
				},
				[mockResponse],
			);

			await node.execute.call(context);

			const args = getHttpRequestArgs(context);
			expect(args.method).toBe('GET');
			expect(args.url).toContain('/application/shops/123/listings/active');
			expect(args.qs).toEqual({ limit: 25, offset: 10 });
		});

		it('should call GET /application/listings/{listingId} for get', async () => {
			const mockResponse = { listing_id: 789, title: 'Test Item' };
			const context = createMockExecuteFunctions(
				{ resource: 'listing', operation: 'get', listingId: 789 },
				[mockResponse],
			);

			await node.execute.call(context);

			const args = getHttpRequestArgs(context);
			expect(args.method).toBe('GET');
			expect(args.url).toContain('/application/listings/789');
		});

		it('should POST to create a draft listing with correct body', async () => {
			const mockResponse = { listing_id: 999, state: 'draft' };
			const context = createMockExecuteFunctions(
				{
					resource: 'listing',
					operation: 'createDraft',
					shopId: 123,
					title: 'New Item',
					description: 'A great item',
					price: 29.99,
					quantity: 5,
					whoMade: 'i_did',
					whenMade: 'made_to_order',
					taxonomyId: 42,
				},
				[mockResponse],
			);

			await node.execute.call(context);

			const args = getHttpRequestArgs(context);
			expect(args.method).toBe('POST');
			expect(args.url).toContain('/application/shops/123/listings');
			expect(args.body).toEqual({
				title: 'New Item',
				description: 'A great item',
				price: 29.99,
				quantity: 5,
				who_made: 'i_did',
				when_made: 'made_to_order',
				taxonomy_id: 42,
			});
		});

		it('should PATCH to update a listing', async () => {
			const mockResponse = { listing_id: 789, title: 'Updated' };
			const context = createMockExecuteFunctions(
				{
					resource: 'listing',
					operation: 'update',
					listingId: 789,
					updateFields: { title: 'Updated', price: 19.99 },
				},
				[mockResponse],
			);

			await node.execute.call(context);

			const args = getHttpRequestArgs(context);
			expect(args.method).toBe('PATCH');
			expect(args.url).toContain('/application/listings/789');
			expect(args.body).toEqual({ title: 'Updated', price: 19.99 });
		});

		it('should DELETE a listing', async () => {
			const context = createMockExecuteFunctions(
				{ resource: 'listing', operation: 'delete', listingId: 789 },
				[{}],
			);

			await node.execute.call(context);

			const args = getHttpRequestArgs(context);
			expect(args.method).toBe('DELETE');
			expect(args.url).toContain('/application/listings/789');
		});
	});

	describe('Receipt resource', () => {
		it('should GET all receipts with filters', async () => {
			const mockResponse = { count: 2, results: [] };
			const context = createMockExecuteFunctions(
				{
					resource: 'receipt',
					operation: 'getAll',
					shopId: 123,
					limit: 50,
					offset: 0,
					filters: { was_paid: true, was_shipped: false },
				},
				[mockResponse],
			);

			await node.execute.call(context);

			const args = getHttpRequestArgs(context);
			expect(args.method).toBe('GET');
			expect(args.url).toContain('/application/shops/123/receipts');
			expect(args.qs).toEqual({
				limit: 50,
				offset: 0,
				was_paid: true,
				was_shipped: false,
			});
		});

		it('should GET a single receipt', async () => {
			const mockResponse = { receipt_id: 555, was_paid: true };
			const context = createMockExecuteFunctions(
				{ resource: 'receipt', operation: 'get', shopId: 123, receiptId: 555 },
				[mockResponse],
			);

			await node.execute.call(context);

			const args = getHttpRequestArgs(context);
			expect(args.method).toBe('GET');
			expect(args.url).toContain('/application/shops/123/receipts/555');
		});

		it('should PUT to update a receipt', async () => {
			const mockResponse = { receipt_id: 555, was_shipped: true };
			const context = createMockExecuteFunctions(
				{
					resource: 'receipt',
					operation: 'update',
					shopId: 123,
					receiptId: 555,
					updateFields: { was_shipped: true },
				},
				[mockResponse],
			);

			await node.execute.call(context);

			const args = getHttpRequestArgs(context);
			expect(args.method).toBe('PUT');
			expect(args.url).toContain('/application/shops/123/receipts/555');
			expect(args.body).toEqual({ was_shipped: true });
		});
	});

	describe('Review resource', () => {
		it('should GET all reviews with pagination', async () => {
			const mockResponse = { count: 10, results: [] };
			const context = createMockExecuteFunctions(
				{
					resource: 'review',
					operation: 'getAll',
					shopId: 123,
					limit: 50,
					offset: 0,
				},
				[mockResponse],
			);

			await node.execute.call(context);

			const args = getHttpRequestArgs(context);
			expect(args.method).toBe('GET');
			expect(args.url).toContain('/application/shops/123/reviews');
			expect(args.qs).toEqual({ limit: 50, offset: 0 });
		});
	});

	describe('Listing Image resource', () => {
		it('should GET all images for a listing', async () => {
			const mockResponse = { count: 2, results: [] };
			const context = createMockExecuteFunctions(
				{
					resource: 'listingImage',
					operation: 'getAll',
					shopId: 123,
					listingId: 456,
				},
				[mockResponse],
			);

			await node.execute.call(context);

			const args = getHttpRequestArgs(context);
			expect(args.method).toBe('GET');
			expect(args.url).toContain('/application/shops/123/listings/456/images');
		});

		it('should DELETE a listing image', async () => {
			const context = createMockExecuteFunctions(
				{
					resource: 'listingImage',
					operation: 'delete',
					shopId: 123,
					listingId: 456,
					imageId: 789,
				},
				[{}],
			);

			await node.execute.call(context);

			const args = getHttpRequestArgs(context);
			expect(args.method).toBe('DELETE');
			expect(args.url).toContain('/application/shops/123/listings/456/images/789');
		});
	});

	describe('Shipping Profile resource', () => {
		it('should GET all shipping profiles for a shop', async () => {
			const mockResponse = { count: 1, results: [] };
			const context = createMockExecuteFunctions(
				{ resource: 'shippingProfile', operation: 'getAll', shopId: 123 },
				[mockResponse],
			);

			await node.execute.call(context);

			const args = getHttpRequestArgs(context);
			expect(args.method).toBe('GET');
			expect(args.url).toContain('/application/shops/123/shipping-profiles');
		});
	});

	describe('Shop Section resource', () => {
		it('should GET all sections for a shop', async () => {
			const mockResponse = { count: 3, results: [] };
			const context = createMockExecuteFunctions(
				{ resource: 'shopSection', operation: 'getAll', shopId: 123 },
				[mockResponse],
			);

			await node.execute.call(context);

			const args = getHttpRequestArgs(context);
			expect(args.method).toBe('GET');
			expect(args.url).toContain('/application/shops/123/sections');
		});
	});

	describe('Taxonomy resource', () => {
		it('should GET all taxonomy nodes', async () => {
			const mockResponse = { count: 100, results: [] };
			const context = createMockExecuteFunctions(
				{ resource: 'taxonomy', operation: 'getAll' },
				[mockResponse],
			);

			await node.execute.call(context);

			const args = getHttpRequestArgs(context);
			expect(args.method).toBe('GET');
			expect(args.url).toContain('/application/seller-taxonomy/nodes');
		});

		it('should GET properties for a taxonomy node', async () => {
			const mockResponse = { count: 5, results: [] };
			const context = createMockExecuteFunctions(
				{ resource: 'taxonomy', operation: 'getProperties', taxonomyId: 42 },
				[mockResponse],
			);

			await node.execute.call(context);

			const args = getHttpRequestArgs(context);
			expect(args.method).toBe('GET');
			expect(args.url).toContain('/application/seller-taxonomy/nodes/42/properties');
		});
	});

	describe('Receipt Create Shipment', () => {
		it('should POST tracking info to create a shipment', async () => {
			const mockResponse = { receipt_id: 555, was_shipped: true };
			const context = createMockExecuteFunctions(
				{
					resource: 'receipt',
					operation: 'createShipment',
					shopId: 123,
					receiptId: 555,
					trackingCode: 'DHL123456',
					carrierName: 'dhl',
					sendBcc: true,
					noteToBuyer: 'Your order is on the way!',
				},
				[mockResponse],
			);

			await node.execute.call(context);

			const args = getHttpRequestArgs(context);
			expect(args.method).toBe('POST');
			expect(args.url).toContain('/application/shops/123/receipts/555/tracking');
			expect(args.body).toEqual({
				tracking_code: 'DHL123456',
				carrier_name: 'dhl',
				send_bcc: true,
				note_to_buyer: 'Your order is on the way!',
			});
		});

		it('should omit empty optional fields', async () => {
			const context = createMockExecuteFunctions(
				{
					resource: 'receipt',
					operation: 'createShipment',
					shopId: 123,
					receiptId: 555,
					trackingCode: 'TRACK123',
					carrierName: '',
					sendBcc: false,
					noteToBuyer: '',
				},
				[{ receipt_id: 555 }],
			);

			await node.execute.call(context);

			const args = getHttpRequestArgs(context);
			expect(args.body).toEqual({ tracking_code: 'TRACK123' });
		});
	});

	describe('Listing Inventory resource', () => {
		it('should GET inventory for a listing', async () => {
			const context = createMockExecuteFunctions(
				{ resource: 'listingInventory', operation: 'get', listingId: 456 },
				[{ products: [] }],
			);
			await node.execute.call(context);
			const args = getHttpRequestArgs(context);
			expect(args.method).toBe('GET');
			expect(args.url).toContain('/application/listings/456/inventory');
		});

		it('should PUT to update listing inventory', async () => {
			const context = createMockExecuteFunctions(
				{
					resource: 'listingInventory',
					operation: 'update',
					listingId: 456,
					productsJson: '[{"offerings":[{"price":10,"quantity":5}]}]',
				},
				[{ products: [] }],
			);
			await node.execute.call(context);
			const args = getHttpRequestArgs(context);
			expect(args.method).toBe('PUT');
			expect(args.url).toContain('/application/listings/456/inventory');
			expect(args.body).toEqual({
				products: [{ offerings: [{ price: 10, quantity: 5 }] }],
			});
		});
	});

	describe('Listing Property resource', () => {
		it('should GET properties for a listing', async () => {
			const context = createMockExecuteFunctions(
				{ resource: 'listingProperty', operation: 'getAll', shopId: 123, listingId: 456 },
				[{ count: 3, results: [] }],
			);
			await node.execute.call(context);
			const args = getHttpRequestArgs(context);
			expect(args.method).toBe('GET');
			expect(args.url).toContain('/application/shops/123/listings/456/properties');
		});
	});

	describe('Payment resource', () => {
		it('should GET all payments for a shop', async () => {
			const context = createMockExecuteFunctions(
				{ resource: 'payment', operation: 'getAll', shopId: 123, limit: 50, offset: 0 },
				[{ count: 1, results: [] }],
			);
			await node.execute.call(context);
			const args = getHttpRequestArgs(context);
			expect(args.method).toBe('GET');
			expect(args.url).toContain('/application/shops/123/payments');
		});

		it('should GET payments by receipt', async () => {
			const context = createMockExecuteFunctions(
				{ resource: 'payment', operation: 'getByReceipt', shopId: 123, receiptId: 555 },
				[{ count: 1, results: [] }],
			);
			await node.execute.call(context);
			const args = getHttpRequestArgs(context);
			expect(args.method).toBe('GET');
			expect(args.url).toContain('/application/shops/123/receipts/555/payments');
		});
	});

	describe('Receipt Transaction resource', () => {
		it('should GET transactions for a receipt', async () => {
			const context = createMockExecuteFunctions(
				{ resource: 'transaction', operation: 'getAll', shopId: 123, receiptId: 555 },
				[{ count: 2, results: [] }],
			);
			await node.execute.call(context);
			const args = getHttpRequestArgs(context);
			expect(args.method).toBe('GET');
			expect(args.url).toContain('/application/shops/123/receipts/555/transactions');
		});

		it('should GET transactions by shop', async () => {
			const context = createMockExecuteFunctions(
				{ resource: 'transaction', operation: 'getByShop', shopId: 123, limit: 50, offset: 0 },
				[{ count: 10, results: [] }],
			);
			await node.execute.call(context);
			const args = getHttpRequestArgs(context);
			expect(args.method).toBe('GET');
			expect(args.url).toContain('/application/shops/123/transactions');
		});
	});

	describe('Return Policy resource', () => {
		it('should GET return policies for a shop', async () => {
			const context = createMockExecuteFunctions(
				{ resource: 'returnPolicy', operation: 'getAll', shopId: 123 },
				[{ count: 1, results: [] }],
			);
			await node.execute.call(context);
			const args = getHttpRequestArgs(context);
			expect(args.method).toBe('GET');
			expect(args.url).toContain('/application/shops/123/policies/return');
		});
	});

	describe('Etsy Ads resource', () => {
		it('should GET all promoted listings', async () => {
			const context = createMockExecuteFunctions(
				{ resource: 'etsyAds', operation: 'getAll', shopId: 123, limit: 50, offset: 0 },
				[{ count: 5, results: [] }],
			);
			await node.execute.call(context);
			const args = getHttpRequestArgs(context);
			expect(args.method).toBe('GET');
			expect(args.url).toContain('/application/shops/123/listings/active/promoted');
		});

		it('should GET a promoted listing ad', async () => {
			const context = createMockExecuteFunctions(
				{ resource: 'etsyAds', operation: 'get', shopId: 123, listingId: 456 },
				[{ listing_id: 456, is_promoted: true }],
			);
			await node.execute.call(context);
			const args = getHttpRequestArgs(context);
			expect(args.method).toBe('GET');
			expect(args.url).toContain('/application/shops/123/listings/456/promoted');
		});
	});

	describe('Token refresh', () => {
		it('should retry with new token on 401', async () => {
			const error401 = Object.assign(new Error('Unauthorized'), { statusCode: 401 });
			const successResponse = { shop_id: 123 };
			const tokenResponse = { access_token: 'new-token' };

			const context = createMockExecuteFunctions(
				{ resource: 'shop', operation: 'getMyShop' },
				[error401, tokenResponse, successResponse],
			);

			await node.execute.call(context);

			const httpMock = context.helpers.httpRequest as jest.Mock;
			expect(httpMock).toHaveBeenCalledTimes(3);

			// First call: original request that got 401
			expect(httpMock.mock.calls[0][0].url).toContain('/application/users/me/shops');

			// Second call: token refresh
			expect(httpMock.mock.calls[1][0].url).toContain('/oauth/token');
			expect(httpMock.mock.calls[1][0].body).toContain('grant_type=refresh_token');
			expect(httpMock.mock.calls[1][0].body).toContain('client_id=test-client-id');

			// Third call: retry with new token
			expect(httpMock.mock.calls[2][0].headers['Authorization']).toBe('Bearer new-token');
		});

		it('should throw NodeApiError when refresh also fails', async () => {
			const error401 = Object.assign(new Error('Unauthorized'), { statusCode: 401 });
			const refreshError = new Error('Refresh failed');

			const context = createMockExecuteFunctions(
				{ resource: 'shop', operation: 'getMyShop' },
				[error401, refreshError],
			);

			await expect(node.execute.call(context)).rejects.toThrow();
		});

		it('should throw on non-401 errors without retrying', async () => {
			const error500 = Object.assign(new Error('Server Error'), { statusCode: 500 });

			const context = createMockExecuteFunctions(
				{ resource: 'shop', operation: 'getMyShop' },
				[error500],
			);

			await expect(node.execute.call(context)).rejects.toThrow();

			const httpMock = context.helpers.httpRequest as jest.Mock;
			expect(httpMock).toHaveBeenCalledTimes(1);
		});
	});

	describe('Continue on fail', () => {
		it('should return error data when continueOnFail is true', async () => {
			const error500 = Object.assign(new Error('Server Error'), { statusCode: 500 });

			const context = createMockExecuteFunctions(
				{ resource: 'shop', operation: 'getMyShop' },
				[error500],
			);
			(context.continueOnFail as jest.Mock).mockReturnValue(true);

			const result = await node.execute.call(context);

			expect(result).toBeDefined();
			expect(result[0]).toBeDefined();
		});
	});

	describe('Headers', () => {
		it('should send x-api-key in clientId:clientSecret format', async () => {
			const context = createMockExecuteFunctions(
				{ resource: 'shop', operation: 'getMyShop' },
				[{ shop_id: 1 }],
			);

			await node.execute.call(context);

			const args = getHttpRequestArgs(context);
			expect(args.headers!['x-api-key']).toBe('test-client-id:test-client-secret');
		});

		it('should send Bearer token in Authorization header', async () => {
			const context = createMockExecuteFunctions(
				{ resource: 'shop', operation: 'getMyShop' },
				[{ shop_id: 1 }],
			);

			await node.execute.call(context);

			const args = getHttpRequestArgs(context);
			expect(args.headers!['Authorization']).toBe('Bearer test-access-token');
		});
	});
});
