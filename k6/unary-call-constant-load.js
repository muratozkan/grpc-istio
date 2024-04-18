import {check} from 'k6';
import grpc from 'k6/net/grpc';
import {GrpcX} from './x-grpc.js';

export let options = {
    discardResponseBodies: true,
    summaryTrendStats: ["min", "med", "avg", "max", "p(0)", "p(50)", "p(75)", "p(90)", "p(99)", "p(99.9)", "p(100)"],
    scenarios: {
        unaryCall: {
            executor: 'ramping-arrival-rate',             // See docs https://k6.io/docs/using-k6/scenarios/executors/
            preAllocatedVUs: 2,
            maxVUs: 8,
            startRate: 1,
            timeUnit: '1s',
            gracefulStop: '30s',
            stages: [
                {target: 200, duration: '1m'},
                {target: 200, duration: '20m'},
                {target: 0, duration: '1m'},
            ]
        }
    }
};
const host = 'localhost:80'
const opts = {
    plaintext: true,
    paths: [
        '../src/main/proto/',
    ],
    protos: [
        'test.proto'
    ]
}
console.log(`Init: ${__VU}`)
const client = new GrpcX(host, opts);

export default function () {
    let connected = true;
    if (__ITER === 0) {
        connected = client.connect();
    }
    if (!connected) {
        return;
    }
    const request = {delay:  200};
    // console.log(`${index} -> ${JSON.stringify(request)}`)
    const response = client.unaryCall('TestService', 'executeUnary', request, {
        metadata: {'grpc-timeout': '100ms'},
        timeout: 100    // millis
    });
    check(response, {
        'status is Deadline Exceeded': (r) => r && r.status === grpc.StatusDeadlineExceeded,
    });
}

export function teardown() {
    console.log(`Teardown: ${__VU}`)
    client.close();
}
