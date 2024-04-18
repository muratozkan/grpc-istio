import {Counter, Trend} from 'k6/metrics';
import grpc from 'k6/net/grpc';

class GrpcX {
    constructor(host, opts) {
        this.client = new grpc.Client();
        this.opts = opts || {};
        this.host = host;
        this.client.load(this.opts['paths'], ...this.opts['protos']);

        this.connectDuration = new Trend("grpc_connect_duration", true);
        this.connectErrors = new Counter("grpc_connect_error");
        this.connectCount = new Counter("grpc_connect");
        this.callDuration = new Trend("grpc_call_duration", true);
        this.callCount = new Counter("grpc_call_count");
    }

    connect() {
        const start = new Date();
        try {
            this.client.connect(this.host, {plaintext: this.opts['plaintext'] || false});
            this.connectDuration.add(new Date() - start);
            this.connectCount.add(1);
            return true;
        } catch (e) {
            console.error(e);
            this.connectErrors.add(1);
            return false;
        }
    }

    close() {
        this.client.close();
        this.connectCount.add(-1);
    }

    unaryCall(service, method, data, params) {
        const start = new Date();
        this.callCount.add(1, { method: method });
        const response = this.client.invoke(service + '/' + method, data, params || {});
        this.callDuration.add(new Date() - start, { method: method });
        return response;
    }
}

export {
    GrpcX
}
