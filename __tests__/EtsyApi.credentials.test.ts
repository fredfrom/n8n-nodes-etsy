import { EtsyApi } from '../credentials/EtsyApi.credentials';

describe('EtsyApi Credentials', () => {
	const creds = new EtsyApi();

	it('should have correct name and displayName', () => {
		expect(creds.name).toBe('etsyApi');
		expect(creds.displayName).toBe('Etsy API');
	});

	it('should have an icon defined', () => {
		expect(creds.icon).toBeDefined();
	});

	it('should have all four credential fields', () => {
		const names = creds.properties.map((p) => p.name);
		expect(names).toContain('clientId');
		expect(names).toContain('clientSecret');
		expect(names).toContain('accessToken');
		expect(names).toContain('refreshToken');
		expect(names).toHaveLength(4);
	});

	it('should mark clientId as required string without password mask', () => {
		const clientId = creds.properties.find((p) => p.name === 'clientId');
		expect(clientId).toBeDefined();
		expect(clientId!.type).toBe('string');
		expect(clientId!.required).toBe(true);
		expect(clientId!.typeOptions).toBeUndefined();
	});

	it('should mark clientSecret as required password field', () => {
		const clientSecret = creds.properties.find((p) => p.name === 'clientSecret');
		expect(clientSecret).toBeDefined();
		expect(clientSecret!.type).toBe('string');
		expect(clientSecret!.required).toBe(true);
		expect(clientSecret!.typeOptions).toEqual({ password: true });
	});

	it('should mark accessToken as required password field', () => {
		const accessToken = creds.properties.find((p) => p.name === 'accessToken');
		expect(accessToken).toBeDefined();
		expect(accessToken!.type).toBe('string');
		expect(accessToken!.required).toBe(true);
		expect(accessToken!.typeOptions).toEqual({ password: true });
	});

	it('should mark refreshToken as required password field', () => {
		const refreshToken = creds.properties.find((p) => p.name === 'refreshToken');
		expect(refreshToken).toBeDefined();
		expect(refreshToken!.type).toBe('string');
		expect(refreshToken!.required).toBe(true);
		expect(refreshToken!.typeOptions).toEqual({ password: true });
	});

	it('should authenticate with Bearer token and x-api-key headers', () => {
		expect(creds.authenticate).toBeDefined();
		expect(creds.authenticate).toEqual({
			type: 'generic',
			properties: {
				headers: {
					Authorization: '=Bearer {{$credentials.accessToken}}',
					'x-api-key': '={{$credentials.clientId}}:{{$credentials.clientSecret}}',
				},
			},
		});
	});

	it('should use x-api-key with clientId:clientSecret format', () => {
		const headers = (creds.authenticate as { properties: { headers: Record<string, string> } })
			.properties.headers;
		expect(headers['x-api-key']).toContain(':');
		expect(headers['x-api-key']).toContain('clientId');
		expect(headers['x-api-key']).toContain('clientSecret');
	});

	it('should test credentials against /application/users/me/shops', () => {
		expect(creds.test).toBeDefined();
		expect(creds.test).toEqual({
			request: {
				baseURL: 'https://openapi.etsy.com/v3',
				url: '/application/users/me/shops',
				method: 'GET',
			},
		});
	});
});
