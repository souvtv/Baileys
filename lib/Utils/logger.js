const P = {
    level: 'trace',
    child: () => P,
    trace: console.debug,
    debug: console.debug,
    info: console.info,
    warn: console.warn,
    error: console.error
};
export default P;
