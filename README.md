# n8n-nodes-etsy

![n8n community node](https://img.shields.io/badge/n8n-community%20node-ff6d5a)
![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)

An [n8n](https://n8n.io) community node for the [Etsy API v3](https://developers.etsy.com/documentation/). Manage your Etsy shop, listings, orders, inventory, images, and more — directly from n8n workflows.

## Features

- **14 resources** with 28+ operations covering the full Etsy seller API
- **Automatic token refresh** on expired OAuth2 tokens
- **Create Shipment** with tracking — automate fulfilment after DHL/USPS/FedEx generates a label
- **Upload listing images** from binary data — connect AI image generators directly to your listings
- **Sync inventory** from external systems — keep stock levels in sync across platforms
- **Etsy Ads** — view promoted listing performance
- **Zero runtime dependencies** — uses only n8n built-in HTTP helpers

## Prerequisites

1. An [Etsy developer account](https://www.etsy.com/developers)
2. A registered Etsy app — create one at [Your Apps](https://www.etsy.com/developers/your-apps)
3. Set your app's callback URL to `http://localhost:3000/callback`
4. Note your **API keystring** (Client ID) and **shared secret** (Client Secret)
5. Node.js 20+ installed

## Getting Credentials

### Step 1: Install

```bash
npm install n8n-nodes-etsy
```

### Step 2: Get OAuth tokens

Run the included helper script with your Etsy app credentials:

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

### Step 3: Configure in n8n

1. Go to **Credentials** > **New Credential** > search **Etsy API**
2. Fill in all four fields:
   - **Client ID** — your Etsy API keystring
   - **Client Secret** — your Etsy shared secret
   - **Access Token** — from the helper script output
   - **Refresh Token** — from the helper script output
3. Save. The node automatically refreshes expired tokens.

> **Note:** Since January 18, 2026, the `x-api-key` header requires the `keystring:secret` format. This node handles that automatically.

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
| Create Draft | Create a new draft listing |
| Update | Update listing fields (title, description, price, quantity, state) |
| Delete | Delete a listing |

### Listing Image

| Operation | Description |
|-----------|-------------|
| Get Many | Get all images for a listing |
| Upload | Upload an image from binary data (supports rank, alt text, overwrite) |
| Delete | Delete a listing image |

### Listing Inventory

| Operation | Description |
|-----------|-------------|
| Get | Get inventory for a listing (variations, SKUs, quantities) |
| Update | Update inventory with JSON product offerings |

### Listing Property

| Operation | Description |
|-----------|-------------|
| Get Many | Get all properties for a listing (material, color, dimensions) |

### Receipt (Order)

| Operation | Description |
|-----------|-------------|
| Get Many | Get receipts for a shop (filter by paid/shipped status) |
| Get | Get a single receipt with full details including delivery address |
| Update | Mark a receipt as shipped or paid |
| Create Shipment | Add tracking number and carrier — sends notification to buyer |

### Receipt Transaction

| Operation | Description |
|-----------|-------------|
| Get Many | Get line items (transactions) for a specific receipt |
| Get Many by Shop | Get all transactions for a shop |

### Payment

| Operation | Description |
|-----------|-------------|
| Get Many | Get all payments for a shop |
| Get Many by Receipt | Get payments for a specific receipt |

### Return Policy

| Operation | Description |
|-----------|-------------|
| Get Many | Get all return policies for a shop |

### Review

| Operation | Description |
|-----------|-------------|
| Get Many | Get all reviews for a shop (with pagination) |

### Shipping Profile

| Operation | Description |
|-----------|-------------|
| Get Many | Get all shipping profiles for a shop |

### Shop Section

| Operation | Description |
|-----------|-------------|
| Get Many | Get all sections for a shop |

### Taxonomy

| Operation | Description |
|-----------|-------------|
| Get Many | Get all seller taxonomy nodes (needed for creating listings) |
| Get Properties | Get the properties of a taxonomy node |

### Etsy Ad

| Operation | Description |
|-----------|-------------|
| Get Many | Get all promoted listing ads for a shop |
| Get | Get ad details for a specific listing |

## Example Workflows

### Automated fulfilment (DHL/FedEx/USPS)

Schedule trigger > **Etsy: Get Many Receipts** (filter: paid but not shipped) > Your shipping API generates label > **Etsy: Create Shipment** with tracking code and carrier name > buyer gets notified automatically.

### AI product images

**HTTP Request** (call your AI image API) > **Etsy: Upload Listing Image** with rank=1 to set as primary image.

### Inventory sync

**Google Sheets** or **Airtable** (your product catalog) > **Etsy: Update Listing Inventory** to sync stock quantities.

### New order alerts

Schedule trigger > **Etsy: Get Many Receipts** (filter: was_paid=true, was_shipped=false) > **Slack** or **Email** with order details and delivery address.

### Review monitoring

Schedule trigger > **Etsy: Get Many Reviews** > filter for ratings below 4 > **Email: Send** alert.

## Installation

### Via n8n Community Nodes (recommended)

1. Go to **Settings** > **Community Nodes**
2. Enter `n8n-nodes-etsy`
3. Click **Install**

### Manual

```bash
cd ~/.n8n/custom
npm install n8n-nodes-etsy
```

Then restart n8n.

## Development

```bash
npm install
npm run build
npm run lint
npm test
```

## Publishing

Push a version tag to trigger the GitHub Actions publish workflow:

```bash
git tag 0.1.0
git push origin 0.1.0
```

Set `NPM_TOKEN` in your GitHub repo secrets, or configure npm Trusted Publishing.

## Compatibility

- n8n version: 1.0+
- Node.js: 20+

## License

[MIT](LICENSE)

## Disclaimer

The term "Etsy" is a trademark of Etsy, Inc. This application uses the Etsy API but is not endorsed or certified by Etsy, Inc.

## Support

Found a bug or have a feature request? [Open an issue on GitHub](https://github.com/friedemannfrommelt/n8n-nodes-etsy/issues).
