export default () => {
process.on('unhandledRejection', (reason: any) => {
if (reason?.code === 'ECONNRESET') return;
console.error('[unhandledRejection]', reason);
});
process.on('uncaughtException', (err: any) => {
if (err?.code === 'ECONNRESET') return;
console.error('[uncaughtException]', err);
});
};