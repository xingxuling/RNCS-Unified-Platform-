import test from 'node:test';
import assert from 'node:assert/strict';
import {rateLimitMiddleware} from '../src/security.mjs';

const response=()=>({headers:{},statusCode:200,body:null,setHeader(name,value){this.headers[name]=value;},status(code){this.statusCode=code;return this;},json(value){this.body=value;return this;}});

test('rate limiter ignores spoofed x-forwarded-for unless Express trust proxy resolves it',()=>{
 const middleware=rateLimitMiddleware({rateLimitPerMinute:1});
 let nextCount=0;
 const first=response();
 middleware({ip:'127.0.0.1',socket:{remoteAddress:'127.0.0.1'},headers:{'x-forwarded-for':'1.1.1.1'}},first,()=>nextCount++);
 const second=response();
 middleware({ip:'127.0.0.1',socket:{remoteAddress:'127.0.0.1'},headers:{'x-forwarded-for':'2.2.2.2'}},second,()=>nextCount++);
 assert.equal(nextCount,1);
 assert.equal(second.statusCode,429);
 assert.deepEqual(second.body,{error:'rate_limited'});
});
