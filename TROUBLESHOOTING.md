# Troubleshooting

## Startup Issues

### Blank Screen / "process is not defined"

If the application fails to start and shows a blank screen, check the browser console. You might see errors related to `process`, `Buffer`, or `global` being undefined.

**Cause:**
The application uses `isomorphic-git`, which relies on Node.js globals (`process`, `Buffer`) that are not present in standard browser environments. While Vite polyfills some of these during build/optimization, they might be missing at runtime in development mode.

**Fix:**
We have included a polyfill file at `src/polyfills.ts` that manually defines these globals on the `window` object.

```typescript
import { Buffer } from 'buffer';

// @ts-ignore
if (typeof window !== 'undefined') {
    // @ts-ignore
    window.global = window;
    // @ts-ignore
    window.Buffer = Buffer;
    // @ts-ignore
    window.process = {
      env: { DEBUG: undefined },
      version: '',
      nextTick: (cb: Function) => setTimeout(cb, 0),
      cwd: () => '/',
      platform: 'browser',
    };
}
```

This file is imported at the very top of `src/main.tsx` before any other imports to ensure globals are available when other modules load.

```typescript
import './polyfills';
import { StrictMode } from 'react'
// ...
```

### "fs is not defined" / File System Errors

If you see errors related to file system operations (e.g., `FS` not found), ensure that `@isomorphic-git/lightning-fs` is correctly installed and initialized. The `GitService` class in `src/services/gitService.ts` handles the initialization of the in-memory file system.

### Netlify Deployment

When deploying to Netlify, ensure the build command is `npm run build` and the publish directory is `dist`. The `netlify.toml` file in the root directory handles this configuration.

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

The redirect rule is crucial for Single Page Applications (SPAs) like this one to handle client-side routing correctly.

