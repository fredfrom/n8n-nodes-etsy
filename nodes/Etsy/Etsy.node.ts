import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

const BASE_URL = 'https://openapi.etsy.com/v3';
const TOKEN_URL = 'https://api.etsy.com/v3/public/oauth/token';

export class Etsy implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Etsy',
		name: 'etsy',
		icon: 'file:etsy.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with the Etsy API v3',
		defaults: {
			name: 'Etsy',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'etsyApi',
				required: true,
			},
		],
		properties: [
			// Resource
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Etsy Ad', value: 'etsyAds' },
					{ name: 'Listing', value: 'listing' },
					{ name: 'Listing Image', value: 'listingImage' },
					{ name: 'Listing Inventory', value: 'listingInventory' },
					{ name: 'Listing Property', value: 'listingProperty' },
					{ name: 'Payment', value: 'payment' },
					{ name: 'Receipt', value: 'receipt' },
					{ name: 'Receipt Transaction', value: 'transaction' },
					{ name: 'Return Policy', value: 'returnPolicy' },
					{ name: 'Review', value: 'review' },
					{ name: 'Shipping Profile', value: 'shippingProfile' },
					{ name: 'Shop', value: 'shop' },
					{ name: 'Shop Section', value: 'shopSection' },
					{ name: 'Taxonomy', value: 'taxonomy' },
				],
				default: 'shop',
			},

			// ── Shop Operations ──
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['shop'] } },
				options: [
					{
						name: 'Get My Shop',
						value: 'getMyShop',
						description: 'Get the shop belonging to the authenticated user',
						action: 'Get my shop',
					},
					{
						name: 'Get',
						value: 'get',
						description: 'Get a shop by ID',
						action: 'Get a shop',
					},
				],
				default: 'getMyShop',
			},
			{
				displayName: 'Shop ID',
				name: 'shopId',
				type: 'number',
				default: 0,
				required: true,
				displayOptions: { show: { resource: ['shop'], operation: ['get'] } },
				description: 'The numeric ID of the Etsy shop',
			},

			// ── Listing Operations ──
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['listing'] } },
				options: [
					{
						name: 'Create Draft',
						value: 'createDraft',
						description: 'Create a new draft listing',
						action: 'Create a draft listing',
					},
					{
						name: 'Delete',
						value: 'delete',
						description: 'Delete a listing',
						action: 'Delete a listing',
					},
					{
						name: 'Get',
						value: 'get',
						description: 'Get a listing by ID',
						action: 'Get a listing',
					},
					{
						name: 'Get All Active',
						value: 'getAllActive',
						description: 'Get all active listings for a shop',
						action: 'Get all active listings',
					},
					{
						name: 'Update',
						value: 'update',
						description: 'Update a listing',
						action: 'Update a listing',
					},
				],
				default: 'getAllActive',
			},
			// Listing: shopId for operations that need it
			{
				displayName: 'Shop ID',
				name: 'shopId',
				type: 'number',
				default: 0,
				required: true,
				displayOptions: {
					show: { resource: ['listing'], operation: ['getAllActive', 'createDraft'] },
				},
				description: 'The numeric ID of the Etsy shop',
			},
			// Listing: listingId
			{
				displayName: 'Listing ID',
				name: 'listingId',
				type: 'number',
				default: 0,
				required: true,
				displayOptions: {
					show: { resource: ['listing'], operation: ['get', 'update', 'delete'] },
				},
				description: 'The numeric ID of the listing',
			},
			// Listing: Get All Active params
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				typeOptions: {
					minValue: 1,
				},
				default: 50,
				displayOptions: { show: { resource: ['listing'], operation: ['getAllActive'] } },
				description: 'Max number of results to return',
			},
			{
				displayName: 'Offset',
				name: 'offset',
				type: 'number',
				default: 0,
				displayOptions: { show: { resource: ['listing'], operation: ['getAllActive'] } },
				description: 'Number of results to skip',
			},
			// Listing: Create Draft fields
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				default: '',
				required: true,
				displayOptions: { show: { resource: ['listing'], operation: ['createDraft'] } },
				description: 'The listing title',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				typeOptions: { rows: 4 },
				default: '',
				required: true,
				displayOptions: { show: { resource: ['listing'], operation: ['createDraft'] } },
				description: 'The listing description',
			},
			{
				displayName: 'Price',
				name: 'price',
				type: 'number',
				typeOptions: { numberPrecision: 2 },
				default: 0,
				required: true,
				displayOptions: { show: { resource: ['listing'], operation: ['createDraft'] } },
				description: 'The price of the listing in the shop currency',
			},
			{
				displayName: 'Quantity',
				name: 'quantity',
				type: 'number',
				default: 1,
				required: true,
				displayOptions: { show: { resource: ['listing'], operation: ['createDraft'] } },
				description: 'The number of items available',
			},
			{
				displayName: 'Who Made',
				name: 'whoMade',
				type: 'options',
				options: [
					{ name: 'I Did', value: 'i_did' },
					{ name: 'Someone Else', value: 'someone_else' },
					{ name: 'Collective', value: 'collective' },
				],
				default: 'i_did',
				required: true,
				displayOptions: { show: { resource: ['listing'], operation: ['createDraft'] } },
				description: 'Who made the item',
			},
			{
				displayName: 'When Made',
				name: 'whenMade',
				type: 'options',
				options: [
					{ name: '1900s', value: '1900s' },
					{ name: '1910s', value: '1910s' },
					{ name: '1920s', value: '1920s' },
					{ name: '1930s', value: '1930s' },
					{ name: '1940s', value: '1940s' },
					{ name: '1950s', value: '1950s' },
					{ name: '1960s', value: '1960s' },
					{ name: '1970s', value: '1970s' },
					{ name: '1980s', value: '1980s' },
					{ name: '1990s', value: '1990s' },
					{ name: '2000-2003', value: '2000_2003' },
					{ name: '2004-2009', value: '2004_2009' },
					{ name: '2010-2019', value: '2010_2019' },
					{ name: '2020-2025', value: '2020_2025' },
					{ name: 'Before 2004', value: 'before_2004' },
					{ name: 'Made to Order', value: 'made_to_order' },
				],
				default: 'made_to_order',
				required: true,
				displayOptions: { show: { resource: ['listing'], operation: ['createDraft'] } },
				description: 'When the item was made',
			},
			{
				displayName: 'Taxonomy ID',
				name: 'taxonomyId',
				type: 'number',
				default: 0,
				required: true,
				displayOptions: { show: { resource: ['listing'], operation: ['createDraft'] } },
				description:
					'The Etsy taxonomy ID for the listing category. Use GET /application/seller-taxonomy/nodes to find the right ID.',
			},
			// Listing: Update fields
			{
				displayName: 'Update Fields',
				name: 'updateFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: { show: { resource: ['listing'], operation: ['update'] } },
				options: [
					{
						displayName: 'Description',
						name: 'description',
						type: 'string',
						typeOptions: { rows: 4 },
						default: '',
					},
					{
						displayName: 'Price',
						name: 'price',
						type: 'number',
						typeOptions: { numberPrecision: 2 },
						default: 0,
					},
					{
						displayName: 'Quantity',
						name: 'quantity',
						type: 'number',
						default: 0,
					},
					{
						displayName: 'State',
						name: 'state',
						type: 'options',
						options: [
							{ name: 'Active', value: 'active' },
							{ name: 'Draft', value: 'draft' },
							{ name: 'Inactive', value: 'inactive' },
						],
						default: 'active',
					},
					{
						displayName: 'Title',
						name: 'title',
						type: 'string',
						default: '',
					},
				],
			},

			// ── Receipt Operations ──
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['receipt'] } },
				options: [
					{
						name: 'Create Shipment',
						value: 'createShipment',
						description: 'Mark an order as shipped with tracking info',
						action: 'Create a shipment',
					},
					{
						name: 'Get',
						value: 'get',
						description: 'Get a receipt by ID',
						action: 'Get a receipt',
					},
					{
						name: 'Get Many',
						value: 'getAll',
						description: 'Get many receipts for a shop',
						action: 'Get many receipts',
					},
					{
						name: 'Update',
						value: 'update',
						description: 'Update a receipt',
						action: 'Update a receipt',
					},
				],
				default: 'getAll',
			},
			{
				displayName: 'Shop ID',
				name: 'shopId',
				type: 'number',
				default: 0,
				required: true,
				displayOptions: { show: { resource: ['receipt'] } },
				description: 'The numeric ID of the Etsy shop',
			},
			{
				displayName: 'Receipt ID',
				name: 'receiptId',
				type: 'number',
				default: 0,
				required: true,
				displayOptions: {
					show: { resource: ['receipt'], operation: ['get', 'update', 'createShipment'] },
				},
				description: 'The numeric ID of the receipt (order)',
			},
			// Receipt: Get All params
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				typeOptions: {
					minValue: 1,
				},
				default: 50,
				displayOptions: { show: { resource: ['receipt'], operation: ['getAll'] } },
				description: 'Max number of results to return',
			},
			{
				displayName: 'Offset',
				name: 'offset',
				type: 'number',
				default: 0,
				displayOptions: { show: { resource: ['receipt'], operation: ['getAll'] } },
				description: 'Number of results to skip',
			},
			{
				displayName: 'Filters',
				name: 'filters',
				type: 'collection',
				placeholder: 'Add Filter',
				default: {},
				displayOptions: { show: { resource: ['receipt'], operation: ['getAll'] } },
				options: [
					{
						displayName: 'Was Paid',
						name: 'was_paid',
						type: 'boolean',
						default: true,
						description: 'Whether to filter by paid status',
					},
					{
						displayName: 'Was Shipped',
						name: 'was_shipped',
						type: 'boolean',
						default: false,
						description: 'Whether to filter by shipped status',
					},
				],
			},
			// Receipt: Update fields
			{
				displayName: 'Update Fields',
				name: 'updateFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: { show: { resource: ['receipt'], operation: ['update'] } },
				options: [
					{
						displayName: 'Was Shipped',
						name: 'was_shipped',
						type: 'boolean',
						default: false,
					},
					{
						displayName: 'Was Paid',
						name: 'was_paid',
						type: 'boolean',
						default: false,
					},
				],
			},
			// Receipt: Create Shipment fields
			{
				displayName: 'Tracking Code',
				name: 'trackingCode',
				type: 'string',
				default: '',
				displayOptions: {
					show: { resource: ['receipt'], operation: ['createShipment'] },
				},
				description: 'The tracking number from the shipping carrier',
			},
			{
				displayName: 'Carrier Name',
				name: 'carrierName',
				type: 'string',
				default: '',
				displayOptions: {
					show: { resource: ['receipt'], operation: ['createShipment'] },
				},
				description:
					'The name of the shipping carrier (e.g. "dhl", "usps", "fedex", "ups", "deutsche-post", "royal-mail")',
			},
			{
				displayName: 'Send BCC',
				name: 'sendBcc',
				type: 'boolean',
				default: false,
				displayOptions: {
					show: { resource: ['receipt'], operation: ['createShipment'] },
				},
				description: 'Whether to send a BCC copy of the shipping notification to the seller',
			},
			{
				displayName: 'Note to Buyer',
				name: 'noteToBuyer',
				type: 'string',
				typeOptions: { rows: 3 },
				default: '',
				displayOptions: {
					show: { resource: ['receipt'], operation: ['createShipment'] },
				},
				description: 'Optional message to the buyer included in the shipping notification email',
			},

			// ── Review Operations ──
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['review'] } },
				options: [
					{
						name: 'Get Many',
						value: 'getAll',
						description: 'Get many reviews for a shop',
						action: 'Get many reviews',
					},
				],
				default: 'getAll',
			},
			{
				displayName: 'Shop ID',
				name: 'shopId',
				type: 'number',
				default: 0,
				required: true,
				displayOptions: { show: { resource: ['review'] } },
				description: 'The numeric ID of the Etsy shop',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				typeOptions: {
					minValue: 1,
				},
				default: 50,
				displayOptions: { show: { resource: ['review'], operation: ['getAll'] } },
				description: 'Max number of results to return',
			},
			{
				displayName: 'Offset',
				name: 'offset',
				type: 'number',
				default: 0,
				displayOptions: { show: { resource: ['review'], operation: ['getAll'] } },
				description: 'Number of results to skip',
			},

			// ── Listing Image Operations ──
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['listingImage'] } },
				options: [
					{
						name: 'Delete',
						value: 'delete',
						description: 'Delete a listing image',
						action: 'Delete a listing image',
					},
					{
						name: 'Get Many',
						value: 'getAll',
						description: 'Get many images for a listing',
						action: 'Get many listing images',
					},
					{
						name: 'Upload',
						value: 'upload',
						description: 'Upload an image to a listing',
						action: 'Upload a listing image',
					},
				],
				default: 'getAll',
			},
			{
				displayName: 'Shop ID',
				name: 'shopId',
				type: 'number',
				default: 0,
				required: true,
				displayOptions: { show: { resource: ['listingImage'] } },
				description: 'The numeric ID of the Etsy shop',
			},
			{
				displayName: 'Listing ID',
				name: 'listingId',
				type: 'number',
				default: 0,
				required: true,
				displayOptions: { show: { resource: ['listingImage'] } },
				description: 'The numeric ID of the listing',
			},
			{
				displayName: 'Image ID',
				name: 'imageId',
				type: 'number',
				default: 0,
				required: true,
				displayOptions: {
					show: { resource: ['listingImage'], operation: ['delete'] },
				},
				description: 'The numeric ID of the listing image',
			},
			{
				displayName: 'Binary Property',
				name: 'binaryPropertyName',
				type: 'string',
				default: 'data',
				required: true,
				displayOptions: {
					show: { resource: ['listingImage'], operation: ['upload'] },
				},
				description:
					'Name of the binary property containing the image file to upload. Use an HTTP Request or Read Binary File node to provide the image.',
			},
			{
				displayName: 'Rank',
				name: 'rank',
				type: 'number',
				default: 1,
				displayOptions: {
					show: { resource: ['listingImage'], operation: ['upload'] },
				},
				description:
					'The position of the image in the listing (1 = primary image). Range: 1-10.',
			},
			{
				displayName: 'Overwrite',
				name: 'overwrite',
				type: 'boolean',
				default: false,
				displayOptions: {
					show: { resource: ['listingImage'], operation: ['upload'] },
				},
				description: 'Whether to replace an existing image at this rank',
			},
			{
				displayName: 'Alt Text',
				name: 'altText',
				type: 'string',
				default: '',
				displayOptions: {
					show: { resource: ['listingImage'], operation: ['upload'] },
				},
				description: 'Alt text for the image (accessibility and SEO)',
			},

			// ── Shipping Profile Operations ──
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['shippingProfile'] } },
				options: [
					{
						name: 'Get Many',
						value: 'getAll',
						description: 'Get many shipping profiles for a shop',
						action: 'Get many shipping profiles',
					},
				],
				default: 'getAll',
			},
			{
				displayName: 'Shop ID',
				name: 'shopId',
				type: 'number',
				default: 0,
				required: true,
				displayOptions: { show: { resource: ['shippingProfile'] } },
				description: 'The numeric ID of the Etsy shop',
			},

			// ── Shop Section Operations ──
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['shopSection'] } },
				options: [
					{
						name: 'Get Many',
						value: 'getAll',
						description: 'Get many sections for a shop',
						action: 'Get many shop sections',
					},
				],
				default: 'getAll',
			},
			{
				displayName: 'Shop ID',
				name: 'shopId',
				type: 'number',
				default: 0,
				required: true,
				displayOptions: { show: { resource: ['shopSection'] } },
				description: 'The numeric ID of the Etsy shop',
			},

			// ── Taxonomy Operations ──
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['taxonomy'] } },
				options: [
					{
						name: 'Get Many',
						value: 'getAll',
						description: 'Get many seller taxonomy nodes',
						action: 'Get many taxonomy nodes',
					},
					{
						name: 'Get Properties',
						value: 'getProperties',
						description: 'Get the properties of a taxonomy node',
						action: 'Get taxonomy node properties',
					},
				],
				default: 'getAll',
			},
			{
				displayName: 'Taxonomy ID',
				name: 'taxonomyId',
				type: 'number',
				default: 0,
				required: true,
				displayOptions: {
					show: { resource: ['taxonomy'], operation: ['getProperties'] },
				},
				description: 'The numeric ID of the taxonomy node',
			},

			// ── Listing Inventory Operations ──
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['listingInventory'] } },
				options: [
					{
						name: 'Get',
						value: 'get',
						description: 'Get inventory for a listing (variations, SKUs, quantities)',
						action: 'Get listing inventory',
					},
					{
						name: 'Update',
						value: 'update',
						description: 'Update inventory for a listing',
						action: 'Update listing inventory',
					},
				],
				default: 'get',
			},
			{
				displayName: 'Listing ID',
				name: 'listingId',
				type: 'number',
				default: 0,
				required: true,
				displayOptions: { show: { resource: ['listingInventory'] } },
				description: 'The numeric ID of the listing',
			},
			{
				displayName: 'Products (JSON)',
				name: 'productsJson',
				type: 'string',
				typeOptions: { rows: 6 },
				default: '',
				required: true,
				displayOptions: {
					show: { resource: ['listingInventory'], operation: ['update'] },
				},
				description:
					'JSON array of product offerings. Each product has property_values and offerings with price/quantity.',
			},

			// ── Listing Property Operations ──
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['listingProperty'] } },
				options: [
					{
						name: 'Get Many',
						value: 'getAll',
						description: 'Get many properties for a listing',
						action: 'Get many listing properties',
					},
				],
				default: 'getAll',
			},
			{
				displayName: 'Shop ID',
				name: 'shopId',
				type: 'number',
				default: 0,
				required: true,
				displayOptions: { show: { resource: ['listingProperty'] } },
				description: 'The numeric ID of the Etsy shop',
			},
			{
				displayName: 'Listing ID',
				name: 'listingId',
				type: 'number',
				default: 0,
				required: true,
				displayOptions: { show: { resource: ['listingProperty'] } },
				description: 'The numeric ID of the listing',
			},

			// ── Payment Operations ──
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['payment'] } },
				options: [
					{
						name: 'Get Many',
						value: 'getAll',
						description: 'Get many payments for a shop',
						action: 'Get many payments',
					},
					{
						name: 'Get Many by Receipt',
						value: 'getByReceipt',
						description: 'Get many payments for a specific receipt',
						action: 'Get many payments by receipt',
					},
				],
				default: 'getAll',
			},
			{
				displayName: 'Shop ID',
				name: 'shopId',
				type: 'number',
				default: 0,
				required: true,
				displayOptions: { show: { resource: ['payment'] } },
				description: 'The numeric ID of the Etsy shop',
			},
			{
				displayName: 'Receipt ID',
				name: 'receiptId',
				type: 'number',
				default: 0,
				required: true,
				displayOptions: {
					show: { resource: ['payment'], operation: ['getByReceipt'] },
				},
				description: 'The numeric ID of the receipt',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				typeOptions: {
					minValue: 1,
				},
				default: 50,
				displayOptions: { show: { resource: ['payment'], operation: ['getAll'] } },
				description: 'Max number of results to return',
			},
			{
				displayName: 'Offset',
				name: 'offset',
				type: 'number',
				default: 0,
				displayOptions: { show: { resource: ['payment'], operation: ['getAll'] } },
				description: 'Number of results to skip',
			},

			// ── Receipt Transaction Operations ──
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['transaction'] } },
				options: [
					{
						name: 'Get Many',
						value: 'getAll',
						description: 'Get many transactions (line items) for a receipt',
						action: 'Get many transactions',
					},
					{
						name: 'Get Many by Shop',
						value: 'getByShop',
						description: 'Get many transactions for a shop',
						action: 'Get many transactions by shop',
					},
				],
				default: 'getAll',
			},
			{
				displayName: 'Shop ID',
				name: 'shopId',
				type: 'number',
				default: 0,
				required: true,
				displayOptions: { show: { resource: ['transaction'] } },
				description: 'The numeric ID of the Etsy shop',
			},
			{
				displayName: 'Receipt ID',
				name: 'receiptId',
				type: 'number',
				default: 0,
				required: true,
				displayOptions: {
					show: { resource: ['transaction'], operation: ['getAll'] },
				},
				description: 'The numeric ID of the receipt',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				typeOptions: {
					minValue: 1,
				},
				default: 50,
				displayOptions: { show: { resource: ['transaction'], operation: ['getByShop'] } },
				description: 'Max number of results to return',
			},
			{
				displayName: 'Offset',
				name: 'offset',
				type: 'number',
				default: 0,
				displayOptions: { show: { resource: ['transaction'], operation: ['getByShop'] } },
				description: 'Number of results to skip',
			},

			// ── Return Policy Operations ──
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['returnPolicy'] } },
				options: [
					{
						name: 'Get Many',
						value: 'getAll',
						description: 'Get many return policies for a shop',
						action: 'Get many return policies',
					},
				],
				default: 'getAll',
			},
			{
				displayName: 'Shop ID',
				name: 'shopId',
				type: 'number',
				default: 0,
				required: true,
				displayOptions: { show: { resource: ['returnPolicy'] } },
				description: 'The numeric ID of the Etsy shop',
			},

			// ── Etsy Ads Operations ──
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['etsyAds'] } },
				options: [
					{
						name: 'Get Many',
						value: 'getAll',
						description: 'Get many promoted listing ads for a shop',
						action: 'Get many ads',
					},
					{
						name: 'Get',
						value: 'get',
						description: 'Get a promoted listing ad for a listing',
						action: 'Get an ad',
					},
				],
				default: 'getAll',
			},
			{
				displayName: 'Shop ID',
				name: 'shopId',
				type: 'number',
				default: 0,
				required: true,
				displayOptions: { show: { resource: ['etsyAds'] } },
				description: 'The numeric ID of the Etsy shop',
			},
			{
				displayName: 'Listing ID',
				name: 'listingId',
				type: 'number',
				default: 0,
				required: true,
				displayOptions: {
					show: { resource: ['etsyAds'], operation: ['get'] },
				},
				description: 'The numeric ID of the listing',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				typeOptions: {
					minValue: 1,
				},
				default: 50,
				displayOptions: { show: { resource: ['etsyAds'], operation: ['getAll'] } },
				description: 'Max number of results to return',
			},
			{
				displayName: 'Offset',
				name: 'offset',
				type: 'number',
				default: 0,
				displayOptions: { show: { resource: ['etsyAds'], operation: ['getAll'] } },
				description: 'Number of results to skip',
			},
		],
		usableAsTool: true,
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const credentials = await this.getCredentials('etsyApi');
		const clientId = credentials.clientId as string;
		const clientSecret = credentials.clientSecret as string;
		let accessToken = credentials.accessToken as string;
		const refreshToken = credentials.refreshToken as string;

		const makeRequest = async (
			method: IHttpRequestMethods,
			url: string,
			body?: IDataObject,
			qs?: IDataObject,
		): Promise<IDataObject> => {
			const options: IHttpRequestOptions = {
				method,
				url: `${BASE_URL}${url}`,
				headers: {
					'x-api-key': `${clientId}:${clientSecret}`,
					Authorization: `Bearer ${accessToken}`,
				},
				json: true,
			};

			if (body && Object.keys(body).length > 0) {
				options.body = body;
			}

			if (qs && Object.keys(qs).length > 0) {
				options.qs = qs;
			}

			return (await this.helpers.httpRequest(options)) as IDataObject;
		};

		const refreshAccessToken = async (): Promise<string> => {
			const options: IHttpRequestOptions = {
				method: 'POST',
				url: TOKEN_URL,
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				body: `grant_type=refresh_token&client_id=${encodeURIComponent(clientId)}&refresh_token=${encodeURIComponent(refreshToken)}`,
				json: true,
			};

			const response = (await this.helpers.httpRequest(options)) as IDataObject;
			return response.access_token as string;
		};

		const makeRequestWithRetry = async (
			method: IHttpRequestMethods,
			url: string,
			body?: IDataObject,
			qs?: IDataObject,
		): Promise<IDataObject> => {
			try {
				return await makeRequest(method, url, body, qs);
			} catch (error: unknown) {
				const statusCode =
					error instanceof Object && 'statusCode' in error
						? (error as { statusCode: number }).statusCode
						: undefined;

				if (statusCode === 401) {
					try {
						accessToken = await refreshAccessToken();
						return await makeRequest(method, url, body, qs);
					} catch (refreshError: unknown) {
						throw new NodeApiError(this.getNode(), refreshError as JsonObject, {
							message:
								'Token refresh failed. Please re-authenticate by running scripts/get-tokens.mjs and updating your credentials.',
						});
					}
				}

				throw new NodeApiError(this.getNode(), error as JsonObject);
			}
		};

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;
				let responseData: IDataObject;

				// ── Shop ──
				if (resource === 'shop') {
					if (operation === 'getMyShop') {
						responseData = await makeRequestWithRetry('GET', '/application/users/me/shops');
					} else {
						// get
						const shopId = this.getNodeParameter('shopId', i) as number;
						responseData = await makeRequestWithRetry('GET', `/application/shops/${shopId}`);
					}
				}

				// ── Listing ──
				else if (resource === 'listing') {
					if (operation === 'getAllActive') {
						const shopId = this.getNodeParameter('shopId', i) as number;
						const limit = this.getNodeParameter('limit', i) as number;
						const offset = this.getNodeParameter('offset', i) as number;
						responseData = await makeRequestWithRetry(
							'GET',
							`/application/shops/${shopId}/listings/active`,
							undefined,
							{ limit, offset },
						);
					} else if (operation === 'get') {
						const listingId = this.getNodeParameter('listingId', i) as number;
						responseData = await makeRequestWithRetry(
							'GET',
							`/application/listings/${listingId}`,
						);
					} else if (operation === 'createDraft') {
						const shopId = this.getNodeParameter('shopId', i) as number;
						const title = this.getNodeParameter('title', i) as string;
						const desc = this.getNodeParameter('description', i) as string;
						const price = this.getNodeParameter('price', i) as number;
						const quantity = this.getNodeParameter('quantity', i) as number;
						const whoMade = this.getNodeParameter('whoMade', i) as string;
						const whenMade = this.getNodeParameter('whenMade', i) as string;
						const taxonomyId = this.getNodeParameter('taxonomyId', i) as number;

						responseData = await makeRequestWithRetry(
							'POST',
							`/application/shops/${shopId}/listings`,
							{
								title,
								description: desc,
								price,
								quantity,
								who_made: whoMade,
								when_made: whenMade,
								taxonomy_id: taxonomyId,
							},
						);
					} else if (operation === 'update') {
						const listingId = this.getNodeParameter('listingId', i) as number;
						const updateFields = this.getNodeParameter('updateFields', i) as IDataObject;
						responseData = await makeRequestWithRetry(
							'PATCH',
							`/application/listings/${listingId}`,
							updateFields,
						);
					} else {
						// delete
						const listingId = this.getNodeParameter('listingId', i) as number;
						responseData = await makeRequestWithRetry(
							'DELETE',
							`/application/listings/${listingId}`,
						);
					}
				}

				// ── Receipt ──
				else if (resource === 'receipt') {
					const shopId = this.getNodeParameter('shopId', i) as number;

					if (operation === 'getAll') {
						const limit = this.getNodeParameter('limit', i) as number;
						const offset = this.getNodeParameter('offset', i) as number;
						const filters = this.getNodeParameter('filters', i) as IDataObject;

						const qs: IDataObject = { limit, offset, ...filters };
						responseData = await makeRequestWithRetry(
							'GET',
							`/application/shops/${shopId}/receipts`,
							undefined,
							qs,
						);
					} else if (operation === 'get') {
						const receiptId = this.getNodeParameter('receiptId', i) as number;
						responseData = await makeRequestWithRetry(
							'GET',
							`/application/shops/${shopId}/receipts/${receiptId}`,
						);
					} else if (operation === 'createShipment') {
						const receiptId = this.getNodeParameter('receiptId', i) as number;
						const trackingCode = this.getNodeParameter('trackingCode', i) as string;
						const carrierName = this.getNodeParameter('carrierName', i) as string;
						const sendBcc = this.getNodeParameter('sendBcc', i) as boolean;
						const noteToBuyer = this.getNodeParameter('noteToBuyer', i) as string;

						const body: IDataObject = {};
						if (trackingCode) body.tracking_code = trackingCode;
						if (carrierName) body.carrier_name = carrierName;
						if (sendBcc) body.send_bcc = sendBcc;
						if (noteToBuyer) body.note_to_buyer = noteToBuyer;

						responseData = await makeRequestWithRetry(
							'POST',
							`/application/shops/${shopId}/receipts/${receiptId}/tracking`,
							body,
						);
					} else {
						// update
						const receiptId = this.getNodeParameter('receiptId', i) as number;
						const updateFields = this.getNodeParameter('updateFields', i) as IDataObject;
						responseData = await makeRequestWithRetry(
							'PUT',
							`/application/shops/${shopId}/receipts/${receiptId}`,
							updateFields,
						);
					}
				}

				// ── Review ──
				else if (resource === 'review') {
					const shopId = this.getNodeParameter('shopId', i) as number;
					const limit = this.getNodeParameter('limit', i) as number;
					const offset = this.getNodeParameter('offset', i) as number;
					responseData = await makeRequestWithRetry(
						'GET',
						`/application/shops/${shopId}/reviews`,
						undefined,
						{ limit, offset },
					);
				}

				// ── Listing Image ──
				else if (resource === 'listingImage') {
					const shopId = this.getNodeParameter('shopId', i) as number;
					const listingId = this.getNodeParameter('listingId', i) as number;

					if (operation === 'getAll') {
						responseData = await makeRequestWithRetry(
							'GET',
							`/application/shops/${shopId}/listings/${listingId}/images`,
						);
					} else if (operation === 'upload') {
						const binaryPropertyName = this.getNodeParameter(
							'binaryPropertyName',
							i,
						) as string;
						const rank = this.getNodeParameter('rank', i) as number;
						const overwrite = this.getNodeParameter('overwrite', i) as boolean;
						const altText = this.getNodeParameter('altText', i) as string;

						const binaryData = this.helpers.assertBinaryData(i, binaryPropertyName);
						const buffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);

						const boundary = `----n8nBoundary${Date.now()}`;
						const fileName = binaryData.fileName ?? 'image.jpg';
						const mimeType = binaryData.mimeType ?? 'image/jpeg';

						const parts: Buffer[] = [];
						const addField = (name: string, value: string) => {
							parts.push(
								Buffer.from(
									`--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`,
								),
							);
						};

						addField('rank', rank.toString());
						addField('overwrite', overwrite.toString());
						if (altText) addField('alt_text', altText);

						parts.push(
							Buffer.from(
								`--${boundary}\r\nContent-Disposition: form-data; name="image"; filename="${fileName}"\r\nContent-Type: ${mimeType}\r\n\r\n`,
							),
						);
						parts.push(buffer);
						parts.push(Buffer.from(`\r\n--${boundary}--\r\n`));

						const body = Buffer.concat(parts);

						const uploadOptions: IHttpRequestOptions = {
							method: 'POST',
							url: `${BASE_URL}/application/shops/${shopId}/listings/${listingId}/images`,
							headers: {
								'x-api-key': `${clientId}:${clientSecret}`,
								Authorization: `Bearer ${accessToken}`,
								'Content-Type': `multipart/form-data; boundary=${boundary}`,
							},
							body,
							json: true,
						};

						// eslint-disable-next-line @n8n/community-nodes/no-http-request-with-manual-auth
						responseData = (await this.helpers.httpRequest(uploadOptions)) as IDataObject;
					} else {
						// delete
						const imageId = this.getNodeParameter('imageId', i) as number;
						responseData = await makeRequestWithRetry(
							'DELETE',
							`/application/shops/${shopId}/listings/${listingId}/images/${imageId}`,
						);
					}
				}

				// ── Shipping Profile ──
				else if (resource === 'shippingProfile') {
					const shopId = this.getNodeParameter('shopId', i) as number;
					responseData = await makeRequestWithRetry(
						'GET',
						`/application/shops/${shopId}/shipping-profiles`,
					);
				}

				// ── Shop Section ──
				else if (resource === 'shopSection') {
					const shopId = this.getNodeParameter('shopId', i) as number;
					responseData = await makeRequestWithRetry(
						'GET',
						`/application/shops/${shopId}/sections`,
					);
				}

				// ── Taxonomy ──
				else if (resource === 'taxonomy') {
					if (operation === 'getAll') {
						responseData = await makeRequestWithRetry(
							'GET',
							'/application/seller-taxonomy/nodes',
						);
					} else {
						// getProperties
						const taxonomyId = this.getNodeParameter('taxonomyId', i) as number;
						responseData = await makeRequestWithRetry(
							'GET',
							`/application/seller-taxonomy/nodes/${taxonomyId}/properties`,
						);
					}
				}

				// ── Listing Inventory ──
				else if (resource === 'listingInventory') {
					const listingId = this.getNodeParameter('listingId', i) as number;

					if (operation === 'get') {
						responseData = await makeRequestWithRetry(
							'GET',
							`/application/listings/${listingId}/inventory`,
						);
					} else {
						// update
						const productsJson = this.getNodeParameter('productsJson', i) as string;
						const products = JSON.parse(productsJson) as IDataObject[];
						responseData = await makeRequestWithRetry(
							'PUT',
							`/application/listings/${listingId}/inventory`,
							{ products },
						);
					}
				}

				// ── Listing Property ──
				else if (resource === 'listingProperty') {
					const shopId = this.getNodeParameter('shopId', i) as number;
					const listingId = this.getNodeParameter('listingId', i) as number;
					responseData = await makeRequestWithRetry(
						'GET',
						`/application/shops/${shopId}/listings/${listingId}/properties`,
					);
				}

				// ── Payment ──
				else if (resource === 'payment') {
					const shopId = this.getNodeParameter('shopId', i) as number;

					if (operation === 'getAll') {
						const limit = this.getNodeParameter('limit', i) as number;
						const offset = this.getNodeParameter('offset', i) as number;
						responseData = await makeRequestWithRetry(
							'GET',
							`/application/shops/${shopId}/payments`,
							undefined,
							{ limit, offset },
						);
					} else {
						// getByReceipt
						const receiptId = this.getNodeParameter('receiptId', i) as number;
						responseData = await makeRequestWithRetry(
							'GET',
							`/application/shops/${shopId}/receipts/${receiptId}/payments`,
						);
					}
				}

				// ── Receipt Transaction ──
				else if (resource === 'transaction') {
					const shopId = this.getNodeParameter('shopId', i) as number;

					if (operation === 'getAll') {
						const receiptId = this.getNodeParameter('receiptId', i) as number;
						responseData = await makeRequestWithRetry(
							'GET',
							`/application/shops/${shopId}/receipts/${receiptId}/transactions`,
						);
					} else {
						// getByShop
						const limit = this.getNodeParameter('limit', i) as number;
						const offset = this.getNodeParameter('offset', i) as number;
						responseData = await makeRequestWithRetry(
							'GET',
							`/application/shops/${shopId}/transactions`,
							undefined,
							{ limit, offset },
						);
					}
				}

				// ── Return Policy ──
				else if (resource === 'returnPolicy') {
					const shopId = this.getNodeParameter('shopId', i) as number;
					responseData = await makeRequestWithRetry(
						'GET',
						`/application/shops/${shopId}/policies/return`,
					);
				}

				// ── Etsy Ads ──
				else {
					const shopId = this.getNodeParameter('shopId', i) as number;

					if (operation === 'getAll') {
						const limit = this.getNodeParameter('limit', i) as number;
						const offset = this.getNodeParameter('offset', i) as number;
						responseData = await makeRequestWithRetry(
							'GET',
							`/application/shops/${shopId}/listings/active/promoted`,
							undefined,
							{ limit, offset },
						);
					} else {
						// get
						const listingId = this.getNodeParameter('listingId', i) as number;
						responseData = await makeRequestWithRetry(
							'GET',
							`/application/shops/${shopId}/listings/${listingId}/promoted`,
						);
					}
				}

				const executionData = this.helpers.constructExecutionMetaData(
					this.helpers.returnJsonArray(responseData!),
					{ itemData: { item: i } },
				);
				returnData.push(...executionData);
			} catch (error: unknown) {
				if (this.continueOnFail()) {
					const executionErrorData = this.helpers.constructExecutionMetaData(
						this.helpers.returnJsonArray({ error: (error as Error).message }),
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
