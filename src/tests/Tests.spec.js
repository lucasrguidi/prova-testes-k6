import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

export const getCatFactsDuration = new Trend('get_cat_facts_duration', true);
export const rateStatusCodeOk = new Rate('rate_status_code_ok');

const BASE_URL = 'https://catfact.ninja/fact';
const STATUS_OK = 200;

export let options = {
  stages: [
    { duration: '1m', target: 10 },
    { duration: '2m', target: 100 },
    { duration: '1m', target: 200 },
    { duration: '1m', target: 300 }
  ],
  thresholds: {
    http_req_duration: ['p(95)<5700'],
    rate_status_code_ok: ['rate>0.95'],
    http_req_failed: ['rate<0.12']
  }
};

export function handleSummary(data) {
  return {
    './src/output/index.html': htmlReport(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true })
  };
}

export default function () {
  const res = http.get(BASE_URL);

  getCatFactsDuration.add(res.timings.duration);

  rateStatusCodeOk.add(res.status === STATUS_OK);

  check(res, {
    'Status is 200': r => r.status === STATUS_OK,
    'Returned a fact': r => r.json().fact && r.json().fact.length > 0
  });

  sleep(1);
}
