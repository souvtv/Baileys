import EventEmitter from '../../Utils/event-emitter.js';
export class AbstractSocketClient extends EventEmitter {
    constructor(url, config) {
        super();
        this.url = url;
        this.config = config;
    }
}
