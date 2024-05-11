/*
** EPITECH PROJECT, 2024
** epytodo-checker
** File description:
** Test
*/

import { baseURL, storage } from "../index.js";

export enum TestStatus {
    WAITING = 'WAITING',
    PASSED = 'PASSED',
    FAILED = 'FAILED',
    ERROR = 'ERROR',
    SKIPPED = 'SKIPPED'
};

const PREFIXES: Record<TestStatus, string> = {
    WAITING: '\x1b[47m\x1b[30mWAITING\x1b[0m',
    PASSED: '\x1b[42m\x1b[30mPASSED\x1b[0m',
    FAILED: '\x1b[41m\x1b[30mFAILED\x1b[0m',
    ERROR: '\x1b[41m\x1b[30mERROR\x1b[0m',
    SKIPPED: '\x1b[100m\x1b[30mSKIPPED\x1b[0m'
};

export type Method = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

function handleReplacement(exp: string): string {
    const replaceMatch = exp.match(/{(\w+)}/);

    if (!replaceMatch)
        return exp;
    return storage.get(replaceMatch[1]) || exp;
}

function handleCheck(exp: string, value: string) {
    const checkMatch = exp.match(/\[(\w+)\]/);

    if (!checkMatch)
        return false;
    switch (checkMatch[1]) {
        case "number": {
            if (isNaN(Number(value)) || isNaN(<number><unknown>value))
                return false;
            break;
        }
        case "email": {
            if (!value.match(/^[a-zA-Z0-9._\-+]+@[a-zA-Z0-9.-]+\.[a-zA-Z]+$/))
                return false;
            break;
        }
        default:
            return false;
    }
    return true;
}

function handleAssignment(exp: string, assignValue: string): boolean {
    const assignMatch = exp.match(/>>(\w+)/);

    if (!assignMatch || !assignValue)
        return false;
    storage.set(assignMatch[1], assignValue);
    return true;
}

export default class Test {

    private dependencies: string[] = [];
    private id: string;
    private params: any = {};
    private expected: any = {};
    private isProtected: boolean = false;
    private route: string;
    private status: TestStatus = TestStatus.WAITING;
    private error: string = '';
    private method: Method;
    private expectedStatus: number = 0;
    private expectedStatusNot: number = 0;
    private silent: boolean = false;
    private routeParams: Record<string, string> = {};
    private callback: Function | null = null;

    constructor(id: string, method: Method, route: string, isProtected: boolean = false) {
        this.id = id;
        this.route = route;
        this.isProtected = isProtected;
        this.method = method;
    }

    public setCallback(callback: Function): Test {
        this.callback = callback;
        return this;
    }

    public async runCallback(): Promise<void> {
        if (this.callback)
            await this.callback();
    }

    public setSilent(silent: boolean = true): Test {
        this.silent = silent;
        return this;
    }

    public isSilent(): boolean {
        return this.silent;
    }

    public fillRouteParams(params: Record<string, string>): Test {
        this.routeParams = params;
        return this;
    }

    public setParams(params: Record<string, string>): Test {
        this.params = params;
        return this;
    }

    public addDependency(dep: string): Test {
        this.dependencies.push(dep);
        return this;
    }

    public setExpected(expected: any): Test {
        this.expected = expected;

        for (const key in this.expected) {
            this.expected[key] = handleReplacement(this.expected[key]);
        }
        return this;
    }

    public setExpectedStatus(status: number): Test {
        this.expectedStatus = status;
        return this;
    }

    public setExpectedStatusNot(status: number): Test {
        this.expectedStatusNot = status;
        return this;
    }

    public getDependencies(): string[] {
        return this.dependencies;
    }

    public clearDependencies(): void {
        this.dependencies = [];
    }

    public hasDependencies(): boolean {
        return this.dependencies.length > 0;
    }

    public getStatus(): TestStatus {
        return this.status;
    }

    public getId(): string {
        return this.id;
    }

    public async execute(): Promise<void> {
        if (this.status === TestStatus.ERROR)
            return this.recordResult(this.status, this.error);
        let data = {
            method: this.method,
            headers: {
                'Content-Type': 'application/json',
            } as Record<string, string>,
            body: null as any
        } satisfies RequestInit;
        for (const key in this.params) {
            this.params[key] = handleReplacement(this.params[key]);
        }
        if (this.method !== 'GET')
            data["body"] = JSON.stringify(this.params);

        if (this.isProtected) {
            if (!storage.has('TOKEN')) {
                this.status = TestStatus.ERROR;
                this.recordResult(TestStatus.ERROR, 'No token found');
                return;
            }
            data.headers['Authorization'] = `Bearer ${storage.get('TOKEN')}`;
        }

        for (const key in this.routeParams){
            this.route = this.route.replace(`:${key}`, handleReplacement(this.routeParams[key]));
        }
        if (this.route.includes(':')) {
            this.status = TestStatus.ERROR;
            this.error = 'Missing parameters';
        }

        let res: Response;
        try {
            res = await fetch(baseURL + this.route, data)
        } catch (e: any) {
            this.status = TestStatus.ERROR;
            this.recordResult(TestStatus.ERROR, e.message);
            return;
        }
        if (this.expectedStatus > 0 && res.status !== this.expectedStatus) {
            this.status = TestStatus.FAILED;
            this.recordResult(TestStatus.FAILED, `Expected status ${this.expectedStatus}, got ${res.status}`);
            if (process.argv.includes('--verbose') && res.headers.get('content-type')?.includes('application/json'))
                console.log(await res.json());
            else if (process.argv.includes('--verbose'))
                console.log("RESPONSE NOT JSON - NO VERBOSE AVAILABLE");
            return;
        }
        if (this.expectedStatusNot > 0 && res.status === this.expectedStatusNot) {
            this.status = TestStatus.FAILED;
            this.recordResult(TestStatus.FAILED, `Expected status is not different from ${this.expectedStatusNot}`);
            if (process.argv.includes('--verbose') && res.headers.get('content-type')?.includes('application/json'))
                console.log(await res.json());
            else if (process.argv.includes('--verbose'))
                console.log("RESPONSE NOT JSON - NO VERBOSE AVAILABLE");
            return;
        }
        let json: any;
        if (!res.headers.get('content-type')?.includes('application/json')) {
            this.status = TestStatus.FAILED;
            this.recordResult(TestStatus.FAILED, 'Response is not JSON');
            return;
        }
        try {
            json = await res.json();
        } catch (e: any) {
            this.status = TestStatus.ERROR;
            this.recordResult(TestStatus.ERROR, e.message);
            return;
        }
        if (!json)
            return;
        for (const key in this.expected) {
            if (!json[key]) {
                this.status = TestStatus.FAILED;
                this.recordResult(TestStatus.FAILED, `Expected key ${key} not found`);
                if (process.argv.includes('--verbose'))
                    console.log(json);
                return;
            }
            if (!handleCheck(this.expected[key], json[key]) &&
                !handleAssignment(this.expected[key], json[key]) &&
                json[key] !== this.expected[key]) {
                this.status = TestStatus.FAILED;
                this.recordResult(TestStatus.FAILED, `Expected value ${this.expected[key]} for key ${key}, got ${json[key]}`);
                if (process.argv.includes('--verbose'))
                    console.log(json);
                return;
            }
            handleAssignment(this.expected[key], json[key]);
        }
        this.status = TestStatus.PASSED;
        if (!this.silent)
            this.recordResult(TestStatus.PASSED, 'Test OK');
    }

    public skip(id: string): void {
        this.status = TestStatus.SKIPPED;
        if (!this.silent && !process.argv.includes('--hide-skipped'))
            this.recordResult(TestStatus.SKIPPED, `Skipping due to dependency ${id}`);
    }

    private recordResult(status: TestStatus, msg: string): void {
        console.log(`${PREFIXES[status]} ${this.id} - ${msg}`);
    }

};
