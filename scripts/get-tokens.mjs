#!/usr/bin/env node

/**
 * Etsy OAuth2 PKCE Token Helper
 *
 * Usage:
 *   node scripts/get-tokens.mjs --clientId=YOUR_KEY --clientSecret=YOUR_SECRET
 *
 * Or via environment variables:
 *   ETSY_CLIENT_ID=YOUR_KEY ETSY_CLIENT_SECRET=YOUR_SECRET node scripts/get-tokens.mjs
 *
 * This script:
 * 1. Generates a PKCE code verifier and SHA-256 challenge
 * 2. Prints the Etsy authorization URL for you to open in a browser
 * 3. Starts a local HTTP server on port 3000 to receive the OAuth callback
 * 4. Exchanges the authorization code for access + refresh tokens
 * 5. Prints the tokens so you can paste them into n8n credentials
 */

import { createServer } from 'node:http';
import { randomBytes, createHash } from 'node:crypto';
import { URL } from 'node:url';

const ETSY_AUTH_URL = 'https://www.etsy.com/oauth/connect';
const ETSY_TOKEN_URL = 'https://api.etsy.com/v3/public/oauth/token';
const PORT = process.env.PORT || 3000;
const REDIRECT_URI = `http://localhost:${PORT}/callback`;
const SCOPES = [
	'transactions_r',
	'transactions_w',
	'listings_r',
	'listings_w',
	'shops_r',
	'shops_w',
	'profile_r',
	'reviews_r',
];

function parseArgs() {
	const args = {};
	for (const arg of process.argv.slice(2)) {
		const match = arg.match(/^--(\w+)=(.+)$/);
		if (match) {
			args[match[1]] = match[2];
		}
	}
	return args;
}

function generateCodeVerifier() {
	return randomBytes(32).toString('base64url');
}

function generateCodeChallenge(verifier) {
	return createHash('sha256').update(verifier).digest('base64url');
}

function generateState() {
	return randomBytes(16).toString('hex');
}

async function exchangeCodeForTokens(code, codeVerifier, clientId) {
	const body = new URLSearchParams({
		grant_type: 'authorization_code',
		client_id: clientId,
		redirect_uri: REDIRECT_URI,
		code,
		code_verifier: codeVerifier,
	});

	const response = await fetch(ETSY_TOKEN_URL, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: body.toString(),
	});

	if (!response.ok) {
		const text = await response.text();
		throw new Error(`Token exchange failed (${response.status}): ${text}`);
	}

	return response.json();
}

async function main() {
	const args = parseArgs();
	const clientId = args.clientId || process.env.ETSY_CLIENT_ID;
	const clientSecret = args.clientSecret || process.env.ETSY_CLIENT_SECRET;

	if (!clientId) {
		console.error('Error: clientId is required.');
		console.error('Usage: node scripts/get-tokens.mjs --clientId=YOUR_KEY --clientSecret=YOUR_SECRET');
		console.error('   or: ETSY_CLIENT_ID=YOUR_KEY ETSY_CLIENT_SECRET=YOUR_SECRET node scripts/get-tokens.mjs');
		process.exit(1);
	}

	if (!clientSecret) {
		console.error('Error: clientSecret is required.');
		console.error('Usage: node scripts/get-tokens.mjs --clientId=YOUR_KEY --clientSecret=YOUR_SECRET');
		process.exit(1);
	}

	const codeVerifier = generateCodeVerifier();
	const codeChallenge = generateCodeChallenge(codeVerifier);
	const state = generateState();

	const authUrl = new URL(ETSY_AUTH_URL);
	authUrl.searchParams.set('response_type', 'code');
	authUrl.searchParams.set('client_id', clientId);
	authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
	authUrl.searchParams.set('scope', SCOPES.join(' '));
	authUrl.searchParams.set('state', state);
	authUrl.searchParams.set('code_challenge', codeChallenge);
	authUrl.searchParams.set('code_challenge_method', 'S256');

	console.log('\n=== Etsy OAuth2 Token Helper ===\n');
	console.log('1. Open this URL in your browser:\n');
	console.log(`   ${authUrl.toString()}\n`);
	console.log('2. Authorize the application');
	console.log(`3. You will be redirected to localhost:${PORT} — tokens will appear here\n`);
	console.log(`Waiting for callback on http://localhost:${PORT} ...\n`);

	const server = createServer(async (req, res) => {
		const url = new URL(req.url, `http://localhost:${PORT}`);

		if (url.pathname !== '/callback') {
			res.writeHead(404);
			res.end('Not found');
			return;
		}

		const code = url.searchParams.get('code');
		const returnedState = url.searchParams.get('state');
		const error = url.searchParams.get('error');

		if (error) {
			res.writeHead(400, { 'Content-Type': 'text/html' });
			res.end(`<h1>Error</h1><p>${error}</p>`);
			console.error(`\nError from Etsy: ${error}`);
			server.close();
			process.exit(1);
		}

		if (returnedState !== state) {
			res.writeHead(400, { 'Content-Type': 'text/html' });
			res.end('<h1>Error</h1><p>State mismatch — possible CSRF attack.</p>');
			console.error('\nState mismatch!');
			server.close();
			process.exit(1);
		}

		if (!code) {
			res.writeHead(400, { 'Content-Type': 'text/html' });
			res.end('<h1>Error</h1><p>No authorization code received.</p>');
			console.error('\nNo authorization code received.');
			server.close();
			process.exit(1);
		}

		try {
			const tokens = await exchangeCodeForTokens(code, codeVerifier, clientId);

			res.writeHead(200, { 'Content-Type': 'text/html' });
			res.end(
				'<h1>Success!</h1><p>Tokens received. You can close this window and check your terminal.</p>',
			);

			console.log('=== Tokens Received ===\n');
			console.log('Copy these values into your n8n Etsy API credentials:\n');
			console.log(`  Client ID:     ${clientId}`);
			console.log(`  Client Secret: ${clientSecret}`);
			console.log(`  Access Token:  ${tokens.access_token}`);
			console.log(`  Refresh Token: ${tokens.refresh_token}`);
			console.log(`\nToken type: ${tokens.token_type}`);
			console.log(`Expires in: ${tokens.expires_in} seconds`);
			console.log(
				'\nNote: Etsy rotates refresh tokens on each use. The node handles this automatically.',
			);
		} catch (err) {
			res.writeHead(500, { 'Content-Type': 'text/html' });
			res.end(`<h1>Error</h1><p>${err.message}</p>`);
			console.error(`\nToken exchange failed: ${err.message}`);
		}

		server.close();
	});

	server.listen(PORT);
}

main();
