import { Buffer } from 'buffer/';

// Polyfill Node.js globals for the browser
// Required by isomorphic-git and other node-compatible libraries
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
