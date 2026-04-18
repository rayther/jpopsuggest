# 제이팝추천

Apps In Toss WebView mini app scaffold.

## Start

```bash
npm run dev
```

`npm run dev` automatically detects the current LAN IP and passes it to Granite.
On iOS physical devices, update the Sandbox app's Metro server address to the printed LAN IP if it changed after reboot.

Use the sandbox app with:

```text
intoss://jpopsuggest/jpop
```

## AI setup

Create a `.env` file in the project root and add:

```bash
OPENAI_API_KEY=your_openai_api_key_here
```

The app calls a local Vite server endpoint at `/api/recommend-song`, and that server endpoint calls OpenAI.
This keeps the API key out of the browser.

## Ads

- Bottom banner ad uses the official WebView `TossAds.initialize` + `TossAds.attachBanner` flow.
- Full screen ad uses `loadFullScreenAd` and `showFullScreenAd`.
- Current banner ad group id: `ait.v2.live.8f300bb3c70e46e9`
- Current full screen ad group id: `ait.v2.live.9615280eaf5d47ea`

Replace both IDs with your real console ad group IDs before production.

## Build

```bash
npm run build
```

## Deploy

Before deploying, prepare your Apps In Toss console API key.

```bash
npm run deploy
```

## Links

- Apps In Toss Console: https://apps-in-toss.toss.im/
- Developer Center: https://developers-apps-in-toss.toss.im/
- Community: https://techchat-apps-in-toss.toss.im/
