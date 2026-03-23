# n8n-nodes-etsy

An [n8n](https://n8n.io) community node for the [Etsy API v3](https://developers.etsy.com/documentation/). Manage your Etsy shop, listings, orders, and reviews directly from your n8n workflows.

## Features

- **Shop** — Get your shop details or look up any shop by ID
- **Listings** — Create drafts, update, delete, and browse active listings
- **Receipts (Orders)** — Fetch and update orders, filter by payment/shipping status
- **Reviews** — Read all reviews for your shop
- **Automatic token refresh** — Handles OAuth2 token expiration transparently

## Prerequisites

1. An [Etsy developer account](https://www.etsy.com/developers)
2. A registered Etsy app — go to [Your Apps](https://www.etsy.com/developers/your-apps) and create one
3. Set your app's callback URL to `http://localhost:3000/callback`
4. Note your **API keystring** (Client ID) and **shared secret** (Client Secret) from the app settings
5. Node.js 18+ installed

## Getting Credentials

### 1. Install this package

```bash
npm install n8n-nodes-etsy
```

Or for development:

```bash
git clone https://github.com/friedemannfrommelt/n8n-nodes-etsy.git
cd n8n-nodes-etsy
npm install
npm run build
npm link
```

### 2. Get your access and refresh tokens

Run the included helper script:

```bash
node scripts/get-tokens.mjs --clientId=YOUR_KEYSTRING --clientSecret=YOUR_SECRET
```

Or using environment variables:

```bash
ETSY_CLIENT_ID=YOUR_KEYSTRING ETSY_CLIENT_SECRET=YOUR_SECRET node scripts/get-tokens.mjs
```

The script will:
1. Print an authorization URL — open it in your browser
2. After you authorize, Etsy redirects to localhost:3000
3. The script exchanges the code for tokens and prints them

### 3. Configure credentials in n8n

1. In n8n, go to **Credentials** → **New Credential** → search for **Etsy API**
2. Fill in:
   - **Client ID**: Your Etsy API keystring
   - **Client Secret**: Your Etsy shared secret
   - **Access Token**: From the helper script output
   - **Refresh Token**: From the helper script output
3. Save — the node will automatically refresh expired tokens

> **Note:** Since January 18, 2026, the `x-api-key` header requires the format `keystring:secret`. This node handles that automatically.

## Resources & Operations

### Shop

| Operation | Description |
|-----------|-------------|
| Get My Shop | Get the shop belonging to the authenticated user |
| Get | Get a shop by its numeric ID |

### Listing

| Operation | Description |
|-----------|-------------|
| Get All Active | Get all active listings for a shop (with pagination) |
| Get | Get a single listing by ID |
| Create Draft | Create a new draft listing with title, description, price, etc. |
| Update | Update listing fields (title, description, price, quantity, state) |
| Delete | Delete a listing |

### Receipt (Order)

| Operation | Description |
|-----------|-------------|
| Get All | Get all receipts/orders for a shop (filter by paid/shipped status) |
| Get | Get a single receipt by ID |
| Update | Mark a receipt as shipped or paid |

### Review

| Operation | Description |
|-----------|-------------|
| Get All | Get all reviews for a shop (with pagination) |

## Example Use Cases

### New order notification
Trigger a workflow on a schedule → **Etsy: Get All Receipts** (filter: was_paid=true, was_shipped=false) → **Slack: Send Message** with order details.

### AI-powered customer reply
**Etsy: Get All Receipts** → extract buyer messages → **OpenAI: Generate Reply** → send via email or your preferred channel.

### Listing management
**Google Sheets: Read Rows** (your product catalog) → **Etsy: Create Draft Listing** for each row → review and publish from your Etsy dashboard.

### Review monitoring
Schedule → **Etsy: Get All Reviews** → filter for ratings below 4 → **Email: Send** alert to yourself.

## Installation in n8n

### Community nodes (recommended)

1. Go to **Settings** → **Community Nodes**
2. Enter `n8n-nodes-etsy`
3. Click **Install**

### Manual installation

```bash
cd ~/.n8n/custom
npm install n8n-nodes-etsy
```

Or for development with npm link:

```bash
cd ~/.n8n/custom
npm link n8n-nodes-etsy
```

Then restart n8n.

## Development

```bash
npm install
npm run build
npm run lint
```

## Publishing

This package includes a GitHub Actions workflow that publishes to npm when you push a version tag:

```bash
git tag 0.1.0
git push origin 0.1.0
```

Configure `NPM_TOKEN` in your repo secrets, or set up npm Trusted Publishing for OIDC-based publishing.

## License

MIT

## Disclaimer

The term "Etsy" is a trademark of Etsy, Inc. This application uses the Etsy API but is not endorsed or certified by Etsy, Inc.

## Support

Found a bug or have a feature request? [Open an issue on GitHub](https://github.com/friedemannfrommelt/n8n-nodes-etsy/issues).
