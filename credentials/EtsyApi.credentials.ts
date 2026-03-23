import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class EtsyApi implements ICredentialType {
	name = 'etsyApi';

	displayName = 'Etsy API';

	icon = { light: 'file:../nodes/Etsy/etsy.svg', dark: 'file:../nodes/Etsy/etsy.svg' } as const;

	documentationUrl = 'https://developers.etsy.com/documentation/';

	properties: INodeProperties[] = [
		{
			displayName: 'Client ID (API Keystring)',
			name: 'clientId',
			type: 'string',
			default: '',
			required: true,
			description: 'The Etsy App API keystring from your Etsy developer account',
		},
		{
			displayName: 'Client Secret (Shared Secret)',
			name: 'clientSecret',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'The shared secret from your Etsy App settings',
		},
		{
			displayName: 'Access Token',
			name: 'accessToken',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description:
				'OAuth2 access token. Use the included helper script (scripts/get-tokens.mjs) to obtain this.',
		},
		{
			displayName: 'Refresh Token',
			name: 'refreshToken',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description:
				'OAuth2 refresh token. Use the included helper script (scripts/get-tokens.mjs) to obtain this.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.accessToken}}',
				'x-api-key': '={{$credentials.clientId}}:{{$credentials.clientSecret}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://openapi.etsy.com/v3',
			url: '/application/users/me/shops',
			method: 'GET',
		},
	};
}
